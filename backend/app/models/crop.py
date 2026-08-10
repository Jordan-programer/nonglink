import enum

from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship

from app.core.database import Base, db_enum


class CropCategory(str, enum.Enum):
    CEREAIS = "cereais"
    LEGUMINOSAS = "leguminosas"
    TUBERCULOS = "tuberculos"
    FRUTAS = "frutas"
    HORTALICAS = "hortalicas"
    OUTROS = "outros"


class Crop(Base):
    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    category = Column(db_enum(CropCategory), default=CropCategory.OUTROS, nullable=False)
    default_unit = Column(String(30), default="kg", nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    products = relationship("Product", back_populates="crop")
    harvests = relationship("Harvest", back_populates="crop")
