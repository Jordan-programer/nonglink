from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models.delivery_stop import DeliveryStop, DeliveryStopType
from app.models.farm import Farm
from app.models.order import Order
from app.models.region import Region
from app.models.user import User
from app.services.delivery_pricing import calculate_delivery_fee
from app.services.driver_assignment import find_nearest_available_transporter
from app.services.geo import haversine_km
from app.services.route_optimization import StopPoint, optimize_stops_open_start


def _region_position(db: Session, region_id: int | None) -> tuple[float, float] | None:
    if not region_id:
        return None
    region = db.query(Region).filter(Region.id == region_id).first()
    if region and region.latitude is not None and region.longitude is not None:
        return (region.latitude, region.longitude)
    return None


def _farm_position(db: Session, farm: Farm) -> tuple[float, float] | None:
    if farm.latitude is not None and farm.longitude is not None:
        return (farm.latitude, farm.longitude)
    return _region_position(db, farm.region_id)


@dataclass
class _Route:
    ordered_pickups: list[StopPoint]
    dropoff_position: tuple[float, float]
    total_distance_km: float
    total_weight_kg: float


def _compute_route(db: Session, order: Order) -> _Route | None:
    """Shared by both the checkout-time price preview and the post-payment
    stop creation, so the two always agree on distance/route. Returns None
    when farm/buyer coordinates are missing — callers treat that as
    "delivery pricing/routing unavailable for this order", not an error."""
    farms_by_id: dict[int, Farm] = {}
    weight_by_farm: dict[int, float] = {}
    for item in order.items:
        farm = item.product.farm
        farms_by_id[farm.id] = farm
        weight = (item.product.weight_per_unit_kg or 0.0) * item.quantity
        weight_by_farm[farm.id] = weight_by_farm.get(farm.id, 0.0) + weight

    buyer = db.query(User).filter(User.id == order.buyer_id).first()
    dropoff_position = _region_position(db, buyer.region_id if buyer else None)
    if dropoff_position is None:
        return None

    pickup_points: list[StopPoint] = []
    for farm in farms_by_id.values():
        position = _farm_position(db, farm)
        if position is None:
            return None
        pickup_points.append(StopPoint(latitude=position[0], longitude=position[1], data=farm))

    ordered_pickups = optimize_stops_open_start(pickup_points, dropoff_position)

    total_distance_km = 0.0
    previous_position = None
    for point in ordered_pickups:
        if previous_position is not None:
            total_distance_km += haversine_km(
                previous_position[0], previous_position[1], point.latitude, point.longitude
            )
        previous_position = (point.latitude, point.longitude)

    if previous_position is not None:
        total_distance_km += haversine_km(
            previous_position[0], previous_position[1], dropoff_position[0], dropoff_position[1]
        )

    return _Route(
        ordered_pickups=ordered_pickups,
        dropoff_position=dropoff_position,
        total_distance_km=total_distance_km,
        total_weight_kg=sum(weight_by_farm.values()),
    )


def preview_delivery_fee(db: Session, order: Order) -> Order:
    """Called at checkout (order creation), before any payment happens, so
    the buyer sees and pays items + delivery in one total. Only prices the
    delivery — no DeliveryStop rows and no transporter assignment yet,
    since those only make sense once the order is actually paid for."""
    route = _compute_route(db, order)
    if route is None:
        return order

    order.delivery_distance_km = round(route.total_distance_km, 2)
    order.delivery_fee = calculate_delivery_fee(route.total_distance_km, route.total_weight_kg)
    db.commit()
    db.refresh(order)
    return order


def finalize_delivery(db: Session, order: Order) -> Order:
    """Called right after an order is confirmed (payment verified). Creates
    the actual pickup/dropoff DeliveryStop rows and auto-assigns the
    nearest available transporter. Re-derives the route rather than trusting
    the checkout-time preview, so a stale preview never produces stops that
    don't match the order's current items."""
    route = _compute_route(db, order)
    if route is None:
        return order

    for sequence, point in enumerate(route.ordered_pickups):
        farm: Farm = point.data
        db.add(
            DeliveryStop(
                order_id=order.id,
                stop_type=DeliveryStopType.PICKUP,
                farm_id=farm.id,
                sequence_order=sequence,
                latitude=point.latitude,
                longitude=point.longitude,
            )
        )

    db.add(
        DeliveryStop(
            order_id=order.id,
            stop_type=DeliveryStopType.DROPOFF,
            farm_id=None,
            sequence_order=len(route.ordered_pickups),
            latitude=route.dropoff_position[0],
            longitude=route.dropoff_position[1],
        )
    )

    order.delivery_distance_km = round(route.total_distance_km, 2)
    order.delivery_fee = calculate_delivery_fee(route.total_distance_km, route.total_weight_kg)

    if order.transporter_id is None and route.ordered_pickups:
        first_pickup = route.ordered_pickups[0]
        driver = find_nearest_available_transporter(db, first_pickup.latitude, first_pickup.longitude)
        if driver:
            order.transporter_id = driver.id

    db.commit()
    db.refresh(order)
    return order
