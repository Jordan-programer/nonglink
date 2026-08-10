from datetime import date, datetime

from pydantic import BaseModel

from app.models.harvest import HarvestStatus


class HarvestCreate(BaseModel):
    farm_id: int
    crop_id: int
    planted_at: date
    expected_harvest_at: date
    expected_quantity: float | None = None


class HarvestUpdate(BaseModel):
    expected_harvest_at: date | None = None
    actual_harvest_at: date | None = None
    expected_quantity: float | None = None
    status: HarvestStatus | None = None


class HarvestRead(BaseModel):
    id: int
    farm_id: int
    crop_id: int
    planted_at: date
    expected_harvest_at: date
    actual_harvest_at: date | None
    expected_quantity: float | None
    status: HarvestStatus
    created_at: datetime

    class Config:
        from_attributes = True
