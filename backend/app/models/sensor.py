import enum

from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.core.database import Base, db_enum


class SensorType(str, enum.Enum):
    SOIL_MOISTURE = "soil_moisture"
    TEMPERATURE = "temperature"
    WATER_LEVEL = "water_level"
    HUMIDITY = "humidity"


class Sensor(Base):
    __tablename__ = "sensors"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    type = Column(db_enum(SensorType), nullable=False)
    label = Column(String(120), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    farm = relationship("Farm", back_populates="sensors")
    readings = relationship("SensorReading", back_populates="sensor")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id"), nullable=False)
    value = Column(Float, nullable=False)
    recorded_at = Column(DateTime, server_default=func.now())

    sensor = relationship("Sensor", back_populates="readings")
