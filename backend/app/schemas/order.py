from datetime import datetime

from pydantic import BaseModel

from app.models.order import OrderStatus


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: float


class OrderCreate(BaseModel):
    items: list[OrderItemCreate]


class OrderItemRead(BaseModel):
    id: int
    product_id: int
    quantity: float
    unit_price: float

    class Config:
        from_attributes = True


class OrderRead(BaseModel):
    id: int
    buyer_id: int
    status: OrderStatus
    total_amount: float
    items: list[OrderItemRead] = []

    class Config:
        from_attributes = True


class SaleRead(BaseModel):
    order_id: int
    order_item_id: int
    status: OrderStatus
    created_at: datetime
    product_id: int
    product_name: str
    quantity: float
    unit_price: float
    buyer_name: str
    buyer_email: str
