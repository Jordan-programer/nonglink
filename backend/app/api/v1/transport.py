from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import require_transporter
from app.core.database import get_db
from app.models.farm import Farm
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.region import Region
from app.models.transport_route import TransportRoute
from app.models.user import User
from app.schemas.order import DeliveryStatusUpdate, TransportOrderRead
from app.schemas.transport_route import PopularRouteRead, RouteCreate, RouteRead
from app.schemas.trends import TrendPoint
from app.services.trends import daily_series

router = APIRouter(prefix="/transport", tags=["transport"])

ALLOWED_DELIVERY_STATUSES = {OrderStatus.SHIPPED, OrderStatus.DELIVERED}


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
