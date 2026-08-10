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
    product_name: str
    quantity: float
    unit_price: float

    class Config:
        from_attributes = True


class OrderRead(BaseModel):
    id: int
    buyer_id: int
    transporter_id: int | None
    status: OrderStatus
    total_amount: float
    created_at: datetime
    items: list[OrderItemRead] = []

    class Config:
        from_attributes = True


class AdminOrderRead(OrderRead):
    buyer_name: str
    buyer_email: str


class TransportOrderRead(OrderRead):
    buyer_name: str
    buyer_phone: str | None


class StatusUpdate(BaseModel):
    status: OrderStatus


class DeliveryStatusUpdate(BaseModel):
    status: OrderStatus


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
