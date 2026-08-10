import enum

from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.core.database import Base, db_enum


class PriceSource(str, enum.Enum):
    LISTING = "listing"
    SALE = "sale"
    EXTERNAL = "external"


class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=False)
    price = Column(Float, nullable=False)
    source = Column(db_enum(PriceSource), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    order_item_id = Column(Integer, ForeignKey("order_items.id"), nullable=True)
    external_source_name = Column(String(50), nullable=True)
    recorded_at = Column(DateTime, server_default=func.now(), nullable=False)

    crop = relationship("Crop")
    region = relationship("Region")
