from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    transporter_profile_id = Column(
        Integer, ForeignKey("transporter_profiles.id"), unique=True, nullable=False
    )
    plate = Column(String(20), nullable=False)
    vehicle_type = Column(String(50), nullable=False)
    capacity_kg = Column(Float, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    transporter_profile = relationship("TransporterProfile", back_populates="vehicle")
