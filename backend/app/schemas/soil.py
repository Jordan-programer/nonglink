from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel

from app.models.soil import SatelliteSource


class SoilAnalyzeRequest(BaseModel):
    polygon: dict[str, Any] | None = None


class SoilRecommendation(BaseModel):
    category: Literal["irrigation", "planting", "soil_treatment"]
    level: str


class SoilObservationRead(BaseModel):
    id: int
    farm_id: int
    source: SatelliteSource
    acquisition_date: date
    cloud_cover_pct: float

    ndmi_mean: float | None = None
    ndmi_min: float | None = None
    ndmi_max: float | None = None

    lst_celsius_mean: float | None = None
    lst_celsius_min: float | None = None
    lst_celsius_max: float | None = None

    ndti_mean: float | None = None
    ndti_min: float | None = None
    ndti_max: float | None = None

    salinity_index_mean: float | None = None
    salinity_index_min: float | None = None
    salinity_index_max: float | None = None

    ndvi_mean: float | None = None
    ndvi_min: float | None = None
    ndvi_max: float | None = None

    created_at: datetime
    recommendations: list[SoilRecommendation] = []

    class Config:
        from_attributes = True
