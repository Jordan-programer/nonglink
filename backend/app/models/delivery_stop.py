import enum

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, func
from sqlalchemy.orm import relationship

from app.core.database import Base, db_enum


class DeliveryStopType(str, enum.Enum):
    PICKUP = "pickup"
    DROPOFF = "dropoff"


class DeliveryStopStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"


class DeliveryStop(Base):
    __tablename__ = "delivery_stops"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    stop_type = Column(db_enum(DeliveryStopType), nullable=False)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=True)
    sequence_order = Column(Integer, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    status = Column(db_enum(DeliveryStopStatus), default=DeliveryStopStatus.PENDING, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    order = relationship("Order", back_populates="delivery_stops")
    farm = relationship("Farm")

    @property
    def farm_name(self) -> str | None:
        return self.farm.name if self.farm else None
