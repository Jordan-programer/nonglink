import enum

from sqlalchemy import Column, Integer, Float, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.core.database import Base, db_enum


class SatelliteSource(str, enum.Enum):
    LANDSAT_8 = "landsat_8"
    LANDSAT_9 = "landsat_9"


class SoilObservation(Base):
    __tablename__ = "soil_observations"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    source = Column(db_enum(SatelliteSource), nullable=False)
    acquisition_date = Column(Date, nullable=False)
    cloud_cover_pct = Column(Float, nullable=False)

    ndmi_mean = Column(Float, nullable=True)
    ndmi_min = Column(Float, nullable=True)
    ndmi_max = Column(Float, nullable=True)

    lst_celsius_mean = Column(Float, nullable=True)
    lst_celsius_min = Column(Float, nullable=True)
    lst_celsius_max = Column(Float, nullable=True)

    ndti_mean = Column(Float, nullable=True)
    ndti_min = Column(Float, nullable=True)
    ndti_max = Column(Float, nullable=True)

    salinity_index_mean = Column(Float, nullable=True)
    salinity_index_min = Column(Float, nullable=True)
    salinity_index_max = Column(Float, nullable=True)

    ndvi_mean = Column(Float, nullable=True)
    ndvi_min = Column(Float, nullable=True)
    ndvi_max = Column(Float, nullable=True)

    created_at = Column(DateTime, server_default=func.now())

    farm = relationship("Farm", back_populates="soil_observations")
