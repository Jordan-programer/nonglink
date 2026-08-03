from datetime import datetime

from pydantic import BaseModel

from app.models.sensor import SensorType


class SensorBase(BaseModel):
    type: SensorType
    label: str | None = None


class SensorCreate(SensorBase):
    farm_id: int


class SensorRead(SensorBase):
    id: int
    farm_id: int

    class Config:
        from_attributes = True


class SensorReadingCreate(BaseModel):
    sensor_id: int
    value: float


class SensorReadingRead(BaseModel):
    id: int
    sensor_id: int
    value: float
    recorded_at: datetime

    class Config:
        from_attributes = True
