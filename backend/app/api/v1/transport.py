from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_transporter
from app.core.database import get_db
from app.models.delivery_stop import DeliveryStop, DeliveryStopStatus, DeliveryStopType
from app.models.farm import Farm
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.region import Region
from app.models.transport_route import TransportRoute
from app.models.transporter_document import TransporterDocument, TransporterDocumentType
from app.models.transporter_profile import TransporterProfile, TransporterVerificationStatus
from app.models.user import User
from app.models.vehicle import Vehicle
from app.schemas.earnings import EarningsSummary
from app.schemas.order import DeliveryStatusUpdate, TransportOrderRead
from app.schemas.transport import (
    AvailabilityUpdate,
    LocationUpdate,
    OrderTrackingRead,
    TransporterLocationRead,
    TransporterProfileRead,
    VehicleCreate,
)
from app.schemas.transport_route import PopularRouteRead, RouteCreate, RouteRead
from app.schemas.trends import TrendPoint
from app.services.earnings import compute_earnings
from app.services.file_storage import save_transporter_document
from app.services.trends import daily_series

router = APIRouter(prefix="/transport", tags=["transport"])

ALLOWED_DELIVERY_STATUSES = {OrderStatus.SHIPPED, OrderStatus.DELIVERED}


def _get_or_create_profile(db: Session, transporter: User) -> TransporterProfile:
    profile = (
        db.query(TransporterProfile).filter(TransporterProfile.user_id == transporter.id).first()
    )
    if not profile:
        profile = TransporterProfile(user_id=transporter.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.get("/available", response_model=list[TransportOrderRead])
def list_available_orders(
    db: Session = Depends(get_db),
    transporter: User = Depends(require_transporter),
):
    return (
        db.query(Order)
        .filter(Order.status == OrderStatus.CONFIRMED, Order.transporter_id.is_(None))
        .order_by(Order.created_at)
        .all()
    )


@router.get("/mine", response_model=list[TransportOrderRead])
def list_my_deliveries(
    db: Session = Depends(get_db),
    transporter: User = Depends(require_transporter),
):
    return (
        db.query(Order)
        .filter(Order.transporter_id == transporter.id)
        .order_by(Order.created_at.desc())
        .all()
    )


@router.get("/earnings", response_model=EarningsSummary)
def my_earnings(
    db: Session = Depends(get_db),
    transporter: User = Depends(require_transporter),
):
    gross = (
        db.query(func.coalesce(func.sum(Order.total_amount), 0.0))
        .filter(Order.transporter_id == transporter.id)
        .scalar()
    )
    return compute_earnings(float(gross))


@router.patch("/{order_id}/claim", response_model=TransportOrderRead)
def claim_order(
    order_id: int,
    db: Session = Depends(get_db),
    transporter: User = Depends(require_transporter),
):
    order = db.query(Order).get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status != OrderStatus.CONFIRMED or order.transporter_id is not None:
        raise HTTPException(status_code=400, detail="Order is not available for pickup")

    order.transporter_id = transporter.id
    db.commit()
    db.refresh(order)
    return order


@router.patch("/{order_id}/status", response_model=TransportOrderRead)
def update_delivery_status(
    order_id: int,
    payload: DeliveryStatusUpdate,
    db: Session = Depends(get_db),
    transporter: User = Depends(require_transporter),
):
    if payload.status not in ALLOWED_DELIVERY_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Transportadores só podem marcar como 'enviado' ou 'entregue'",
        )

    order = db.query(Order).get(order_id)
    if not order or order.transporter_id != transporter.id:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = payload.status
    db.commit()
    db.refresh(order)
    return order


@router.get("/deliveries/trends", response_model=list[TrendPoint])
def deliveries_trends(
    db: Session = Depends(get_db),
    transporter: User = Depends(require_transporter),
):
    query = db.query(Order).filter(
        Order.transporter_id == transporter.id, Order.status == OrderStatus.DELIVERED
    )
    return daily_series(query, Order.created_at)


@router.get("/routes/mine", response_model=list[RouteRead])
def list_my_routes(
    db: Session = Depends(get_db),
    transporter: User = Depends(require_transporter),
):
    return (
        db.query(TransportRoute)
        .filter(TransportRoute.transporter_id == transporter.id)
        .order_by(TransportRoute.created_at.desc())
        .all()
    )


@router.get("/routes/popular", response_model=list[PopularRouteRead])
def list_popular_routes(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    transporter: User = Depends(require_transporter),
):
    """Ranks origin -> destination region pairs by how many order items have
    shipped along them, so transporters can see where real demand is before
    committing to a route."""
    rows = (
        db.query(
            Farm.region_id.label("origin_region_id"),
            User.region_id.label("destination_region_id"),
            func.count(OrderItem.id).label("order_count"),
        )
        .select_from(OrderItem)
        .join(Order, OrderItem.order_id == Order.id)
        .join(Product, OrderItem.product_id == Product.id)
        .join(Farm, Product.farm_id == Farm.id)
        .join(User, Order.buyer_id == User.id)
        .filter(Farm.region_id.isnot(None), User.region_id.isnot(None))
        .group_by(Farm.region_id, User.region_id)
        .order_by(func.count(OrderItem.id).desc())
        .limit(limit)
        .all()
    )

    region_ids = {r.origin_region_id for r in rows} | {r.destination_region_id for r in rows}
    regions = {r.id: r.name for r in db.query(Region).filter(Region.id.in_(region_ids)).all()}

    return [
        PopularRouteRead(
            origin_region_id=row.origin_region_id,
            origin_region_name=regions.get(row.origin_region_id, "?"),
            destination_region_id=row.destination_region_id,
            destination_region_name=regions.get(row.destination_region_id, "?"),
            order_count=row.order_count,
        )
        for row in rows
    ]


@router.post("/routes", response_model=RouteRead)
def create_route(
    payload: RouteCreate,
    db: Session = Depends(get_db),
    transporter: User = Depends(require_transporter),
):
    origin = db.query(Region).get(payload.origin_region_id)
    destination = db.query(Region).get(payload.destination_region_id)
    if not origin or not destination:
        raise HTTPException(status_code=404, detail="Region not found")

    route = TransportRoute(
        transporter_id=transporter.id,
        origin_region_id=payload.origin_region_id,
        destination_region_id=payload.destination_region_id,
    )
    db.add(route)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Já tens esta rota registada")
    db.refresh(route)
    return route


@router.delete("/routes/{route_id}", status_code=204)
def delete_route(
    route_id: int,
    db: Session = Depends(get_db),
    transporter: User = Depends(require_transporter),
):
    route = db.query(TransportRoute).get(route_id)
    if not route or route.transporter_id != transporter.id:
        raise HTTPException(status_code=404, detail="Route not found")

    db.delete(route)
    db.commit()


@router.get("/profile", response_model=TransporterProfileRead)
def get_my_transporter_profile(
    db: Session = Depends(get_db),
    transporter: User = Depends(require_transporter),
):
    return _get_or_create_profile(db, transporter)


@router.post("/vehicle", response_model=TransporterProfileRead)
def submit_vehicle(
    payload: VehicleCreate,
    db: Session = Depends(get_db),
    transporter: User = Depends(require_transporter),
):
    profile = _get_or_create_profile(db, transporter)

    vehicle = db.query(Vehicle).filter(Vehicle.transporter_profile_id == profile.id).first()
    if vehicle:
        vehicle.plate = payload.plate
        vehicle.vehicle_type = payload.vehicle_type
        vehicle.capacity_kg = payload.capacity_kg
    else:
        vehicle = Vehicle(transporter_profile_id=profile.id, **payload.model_dump())
        db.add(vehicle)

    db.commit()
    db.refresh(profile)
    return profile


@router.post("/documents", response_model=TransporterProfileRead)
async def upload_transporter_document(
    document_type: TransporterDocumentType,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    transporter: User = Depends(require_transporter),
):
    profile = _get_or_create_profile(db, transporter)

    file_url = await save_transporter_document(file)
    db.add(
        TransporterDocument(
            transporter_profile_id=profile.id, document_type=document_type, file_url=file_url
        )
    )
    db.commit()
    db.refresh(profile)
    return profile


@router.patch("/availability", response_model=TransporterProfileRead)
def set_availability(
    payload: AvailabilityUpdate,
    db: Session = Depends(get_db),
    transporter: User = Depends(require_transporter),
):
    profile = _get_or_create_profile(db, transporter)
    if payload.is_available and profile.verification_status != TransporterVerificationStatus.APPROVED:
        raise HTTPException(
            status_code=403,
            detail="Só podes ficar disponível depois de a tua conta ser aprovada",
        )

    profile.is_available = payload.is_available
    db.commit()
    db.refresh(profile)
    return profile


@router.post("/location", response_model=TransporterProfileRead)
def update_location(
    payload: LocationUpdate,
    db: Session = Depends(get_db),
    transporter: User = Depends(require_transporter),
):
    profile = _get_or_create_profile(db, transporter)
    profile.current_latitude = payload.latitude
    profile.current_longitude = payload.longitude
    profile.location_updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(profile)
    return profile


def _assert_can_view_tracking(db: Session, order: Order, current_user: User) -> None:
    if current_user.id == order.buyer_id or current_user.id == order.transporter_id:
        return
    if current_user.role.value in ("admin", "superadmin"):
        return
    owns_a_farm_in_order = (
        db.query(OrderItem)
        .join(Product, OrderItem.product_id == Product.id)
        .join(Farm, Product.farm_id == Farm.id)
        .filter(OrderItem.order_id == order.id, Farm.owner_id == current_user.id)
        .first()
    )
    if owns_a_farm_in_order:
        return
    raise HTTPException(status_code=403, detail="Sem acesso a esta encomenda")


@router.get("/{order_id}/tracking", response_model=OrderTrackingRead)
def get_order_tracking(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    _assert_can_view_tracking(db, order, current_user)

    location = None
    if order.transporter_id:
        profile = (
            db.query(TransporterProfile)
            .filter(TransporterProfile.user_id == order.transporter_id)
            .first()
        )
        if profile and profile.current_latitude is not None and profile.current_longitude is not None:
            location = TransporterLocationRead(
                latitude=profile.current_latitude,
                longitude=profile.current_longitude,
                updated_at=profile.location_updated_at,
            )

    return OrderTrackingRead(
        order_id=order.id,
        status=order.status.value,
        transporter_location=location,
        stops=order.delivery_stops,
    )


@router.patch("/{order_id}/stops/{stop_id}/complete", response_model=TransportOrderRead)
def complete_delivery_stop(
    order_id: int,
    stop_id: int,
    db: Session = Depends(get_db),
    transporter: User = Depends(require_transporter),
):
    order = db.query(Order).get(order_id)
    if not order or order.transporter_id != transporter.id:
        raise HTTPException(status_code=404, detail="Order not found")

    stop = db.query(DeliveryStop).filter(DeliveryStop.id == stop_id, DeliveryStop.order_id == order_id).first()
    if not stop:
        raise HTTPException(status_code=404, detail="Stop not found")

    stop.status = DeliveryStopStatus.COMPLETED
    stop.completed_at = datetime.now(timezone.utc)
    db.flush()

    if stop.stop_type == DeliveryStopType.PICKUP:
        remaining_pickups = (
            db.query(DeliveryStop)
            .filter(
                DeliveryStop.order_id == order_id,
                DeliveryStop.stop_type == DeliveryStopType.PICKUP,
                DeliveryStop.status == DeliveryStopStatus.PENDING,
            )
            .count()
        )
        if remaining_pickups == 0 and order.status == OrderStatus.CONFIRMED:
            order.status = OrderStatus.COLLECTED
    else:
        if order.status in (OrderStatus.COLLECTED, OrderStatus.SHIPPED):
            order.status = OrderStatus.DELIVERED

    db.commit()
    db.refresh(order)
    return order
