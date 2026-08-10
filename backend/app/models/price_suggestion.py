import enum

from sqlalchemy import Column, Integer, Float, String, JSON, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.core.database import Base, db_enum
from app.models.product import ProductCertification, ProductQuality


class SuggestionConfidence(str, enum.Enum):
    ALTA = "alta"
    MEDIA = "media"
    BAIXA = "baixa"


class FarmerAction(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    ADJUSTED = "adjusted"


class PriceSuggestion(Base):
    __tablename__ = "price_suggestions"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=False)
    quality = Column(db_enum(ProductQuality), nullable=True)
    certification = Column(db_enum(ProductCertification), nullable=True)
    base_price = Column(Float, nullable=False)
    suggested_price = Column(Float, nullable=False)
    range_low = Column(Float, nullable=False)
    range_high = Column(Float, nullable=False)
    confidence = Column(db_enum(SuggestionConfidence), nullable=False)
    factors = Column(JSON, nullable=False)
    price_forecast_status = Column(String(30), nullable=False)
    demand_forecast_status = Column(String(30), nullable=False)
    final_price = Column(Float, nullable=True)
    farmer_action = Column(db_enum(FarmerAction), default=FarmerAction.PENDING, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    product = relationship("Product")
