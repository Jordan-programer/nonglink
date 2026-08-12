from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    location = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    size_hectares = Column(Float, nullable=True)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=True)
    boundary_geojson = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    owner = relationship("User", back_populates="farms")
    region = relationship("Region", back_populates="farms")
    products = relationship("Product", back_populates="farm")
    sensors = relationship("Sensor", back_populates="farm")
    harvests = relationship("Harvest", back_populates="farm")
    soil_observations = relationship("SoilObservation", back_populates="farm")

    @property
    def owner_name(self) -> str:
        return self.owner.name
