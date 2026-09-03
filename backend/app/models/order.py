import enum

from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.core.database import Base, db_enum


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COLLECTED = "collected"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    transporter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    payment_method_id = Column(Integer, ForeignKey("payment_methods.id"), nullable=True)
    status = Column(db_enum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    payment_status = Column(db_enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    paypal_order_id = Column(String(64), nullable=True)
    paypal_capture_id = Column(String(64), nullable=True)
    total_amount = Column(Float, default=0, nullable=False)
    delivery_fee = Column(Float, nullable=True)
    delivery_distance_km = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    buyer = relationship("User", back_populates="orders", foreign_keys=[buyer_id])
    transporter = relationship("User", back_populates="deliveries", foreign_keys=[transporter_id])
    payment_method = relationship("PaymentMethod")
    items = relationship("OrderItem", back_populates="order")
    delivery_stops = relationship(
        "DeliveryStop", back_populates="order", order_by="DeliveryStop.sequence_order"
    )

    @property
    def buyer_name(self) -> str:
        return self.buyer.name

    @property
    def buyer_email(self) -> str | None:
        return self.buyer.email

    @property
    def buyer_phone(self) -> str | None:
        return self.buyer.phone

    @property
    def transporter_name(self) -> str | None:
        return self.transporter.name if self.transporter else None


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")

    @property
    def product_name(self) -> str:
        return self.product.name
