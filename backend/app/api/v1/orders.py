from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.core.database import get_db
from app.models.farm import Farm
from app.models.order import Order, OrderItem, OrderStatus
from app.models.payment_method import PaymentMethod
from app.models.price_history import PriceSource
from app.models.product import Product
from app.models.user import User
from app.schemas.earnings import EarningsSummary
from app.schemas.order import (
    AdminOrderRead,
    OrderCreate,
    OrderPaymentMethodUpdate,
    OrderRead,
    SaleRead,
    StatusUpdate,
)
from app.schemas.trends import TrendPoint
from app.services.delivery_planning import plan_order_delivery
from app.services.earnings import compute_earnings
from app.services.pricing import record_price
from app.services.trends import daily_series

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/", response_model=OrderRead)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = Order(
        buyer_id=current_user.id,
        payment_method_id=payload.payment_method_id,
        total_amount=0,
    )
    db.add(order)
    db.flush()

    total = 0.0
    for item in payload.items:
        product = db.query(Product).get(item.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if product.quantity_available < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for product {product.id}")

        product.quantity_available -= item.quantity
        line_total = product.price_per_unit * item.quantity
        total += line_total

        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=item.quantity,
            unit_price=product.price_per_unit,
        )
        db.add(order_item)
        db.flush()

        record_price(
            db,
            crop_id=product.crop_id,
            region_id=product.farm.region_id,
            price=order_item.unit_price,
            source=PriceSource.SALE,
            product_id=product.id,
            order_item_id=order_item.id,
        )

    order.total_amount = total
    db.commit()
    db.refresh(order)
    return order


@router.get("/", response_model=list[OrderRead])
def list_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Order)
        .filter(Order.buyer_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )


@router.get("/sales", response_model=list[SaleRead])
def list_sales(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(OrderItem, Order, Product, User)
        .join(Order, OrderItem.order_id == Order.id)
        .join(Product, OrderItem.product_id == Product.id)
        .join(Farm, Product.farm_id == Farm.id)
        .join(User, Order.buyer_id == User.id)
        .filter(Farm.owner_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )

    return [
        SaleRead(
            order_id=order.id,
            order_item_id=item.id,
            status=order.status,
            created_at=order.created_at,
            product_id=product.id,
            product_name=product.name,
            quantity=item.quantity,
            unit_price=item.unit_price,
            buyer_name=buyer.name,
            buyer_email=buyer.email,
        )
        for item, order, product, buyer in rows
    ]


@router.get("/sales/trends", response_model=list[TrendPoint])
def sales_trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(OrderItem)
        .join(Order, OrderItem.order_id == Order.id)
        .join(Product, OrderItem.product_id == Product.id)
        .join(Farm, Product.farm_id == Farm.id)
        .filter(Farm.owner_id == current_user.id)
    )
    return daily_series(query, Order.created_at, OrderItem.quantity * OrderItem.unit_price)


@router.get("/sales/summary", response_model=EarningsSummary)
def sales_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    gross = (
        db.query(func.coalesce(func.sum(OrderItem.quantity * OrderItem.unit_price), 0.0))
        .join(Order, OrderItem.order_id == Order.id)
        .join(Product, OrderItem.product_id == Product.id)
        .join(Farm, Product.farm_id == Farm.id)
        .filter(Farm.owner_id == current_user.id)
        .scalar()
    )
    return compute_earnings(float(gross))


@router.get("/all", response_model=list[AdminOrderRead])
def list_all_orders(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return db.query(Order).order_by(Order.created_at.desc()).all()


@router.patch("/{order_id}/status", response_model=AdminOrderRead)
def update_order_status(
    order_id: int,
    payload: StatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    order = db.query(Order).get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    newly_confirmed = (
        payload.status == OrderStatus.CONFIRMED and order.status == OrderStatus.PENDING
    )
    order.status = payload.status
    db.commit()

    if newly_confirmed:
        plan_order_delivery(db, order)

    db.refresh(order)
    return order


@router.patch("/{order_id}/payment-method", response_model=OrderRead)
def set_order_payment_method(
    order_id: int,
    payload: OrderPaymentMethodUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).get(order_id)
    if not order or order.buyer_id != current_user.id:
        raise HTTPException(status_code=404, detail="Order not found")

    method = db.query(PaymentMethod).get(payload.payment_method_id)
    if not method:
        raise HTTPException(status_code=404, detail="Payment method not found")

    order.payment_method_id = method.id
    db.commit()
    db.refresh(order)
    return order


@router.get("/{order_id}", response_model=OrderRead)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).get(order_id)
    if not order or order.buyer_id != current_user.id:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
