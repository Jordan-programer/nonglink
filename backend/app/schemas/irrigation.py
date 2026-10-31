from datetime import datetime, timedelta, timezone

from pydantic import BaseModel, Field, field_validator

from app.models.irrigation import IrrigationStatus


class IrrigationBase(BaseModel):
    duration_minutes: int = Field(..., ge=1, le=600, description="Duração em minutos (1 a 600)")
    notes: str | None = Field(default=None, max_length=255)
    criada_via: str | None = None


class IrrigationCreate(IrrigationBase):
    scheduled_time: datetime

    @field_validator("scheduled_time")
    @classmethod
    def validate_future_scheduled_time(cls, v: datetime) -> datetime:
        now = datetime.now(timezone.utc)
        target = v if v.tzinfo is not None else v.replace(tzinfo=timezone.utc)
        if target < now - timedelta(minutes=1):
            raise ValueError("O horário agendado deve ser no futuro (tolerância máxima de 1 minuto).")
        return v


class IrrigationRead(IrrigationBase):
    id: int
    farm_id: int
    scheduled_time: datetime
    status: IrrigationStatus
    created_at: datetime

    class Config:
        from_attributes = True
