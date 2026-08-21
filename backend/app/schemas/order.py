from datetime import datetime

from pydantic import BaseModel

from app.models.order import OrderStatus, PaymentStatus
from app.schemas.payment_method import PaymentMethodRead


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: float


class OrderCreate(BaseModel):
    items: list[OrderItemCreate]
    payment_method_id: int | None = None


class OrderPaymentMethodUpdate(BaseModel):
    payment_method_id: int


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
    payment_method: PaymentMethodRead | None = None
    status: OrderStatus
    payment_status: PaymentStatus
    total_amount: float
    created_at: datetime
    items: list[OrderItemRead] = []

    class Config:
        from_attributes = True


class AdminOrderRead(OrderRead):
    buyer_name: str
    buyer_email: str | None


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
    buyer_email: str | None
