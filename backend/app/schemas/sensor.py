from datetime import date, datetime

from pydantic import BaseModel

from app.models.sensor import AlertSeverity, SensorType


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


class SensorCreateResponse(SensorRead):
    device_key: str


class SensorReadingCreate(BaseModel):
    sensor_id: int
    value: float
    device_key: str


class SensorReadingRead(BaseModel):
    id: int
    sensor_id: int
    value: float
    recorded_at: datetime

    class Config:
        from_attributes = True


class SensorDailyAggregate(BaseModel):
    day: date
    avg_value: float
    min_value: float
    max_value: float
    count: int


class SensorAlertRead(BaseModel):
    id: int
    sensor_id: int
    reading_id: int
    severity: AlertSeverity
    message: str
    acknowledged: bool
    created_at: datetime

    class Config:
        from_attributes = True
