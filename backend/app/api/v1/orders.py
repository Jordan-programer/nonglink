from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.farm import Farm
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCreate, OrderRead, SaleRead

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/", response_model=OrderRead)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = Order(buyer_id=current_user.id, total_amount=0)
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

        db.add(OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=item.quantity,
            unit_price=product.price_per_unit,
        ))

    order.total_amount = total
    db.commit()
    db.refresh(order)
    return order


@router.get("/", response_model=list[OrderRead])
def list_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Order).filter(Order.buyer_id == current_user.id).all()


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
