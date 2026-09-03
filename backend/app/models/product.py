import enum

from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.core.database import Base, db_enum


class ProductQuality(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"


class ProductCertification(str, enum.Enum):
    NONE = "none"
    ORGANIC = "organic"
    IN_TRANSITION = "in_transition"


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(String(500), nullable=True)
    image_url = Column(String(255), nullable=True)
    unit = Column(String(30), default="kg", nullable=False)
    price_per_unit = Column(Float, nullable=False)
    quantity_available = Column(Float, default=0, nullable=False)
    weight_per_unit_kg = Column(Float, nullable=True)
    quality = Column(db_enum(ProductQuality), nullable=True)
    certification = Column(
        db_enum(ProductCertification), default=ProductCertification.NONE, nullable=False
    )
    created_at = Column(DateTime, server_default=func.now())

    farm = relationship("Farm", back_populates="products")
    crop = relationship("Crop", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")

    @property
    def crop_name(self) -> str:
        return self.crop.name

    @property
    def crop_category(self) -> str:
        return self.crop.category.value

    @property
    def farm_name(self) -> str:
        return self.farm.name

    @property
    def farm_owner_id(self) -> int:
        return self.farm.owner_id

    @property
    def farm_owner_name(self) -> str:
        return self.farm.owner_name
