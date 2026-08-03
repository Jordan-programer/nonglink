from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(String(500), nullable=True)
    category = Column(String(100), nullable=True)
    unit = Column(String(30), default="kg", nullable=False)
    price_per_unit = Column(Float, nullable=False)
    quantity_available = Column(Float, default=0, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    farm = relationship("Farm", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")
