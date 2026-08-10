import enum

from sqlalchemy import Column, Integer, Float, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.core.database import Base, db_enum


class HarvestStatus(str, enum.Enum):
    PLANTED = "planted"
    GROWING = "growing"
    HARVESTED = "harvested"
    CANCELLED = "cancelled"


class Harvest(Base):
    __tablename__ = "harvests"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False)
    planted_at = Column(Date, nullable=False)
    expected_harvest_at = Column(Date, nullable=False)
    actual_harvest_at = Column(Date, nullable=True)
    expected_quantity = Column(Float, nullable=True)
    status = Column(db_enum(HarvestStatus), default=HarvestStatus.PLANTED, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    farm = relationship("Farm", back_populates="harvests")
    crop = relationship("Crop", back_populates="harvests")
