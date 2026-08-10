from datetime import datetime

from pydantic import BaseModel

from app.models.price_history import PriceSource
from app.models.price_suggestion import FarmerAction, SuggestionConfidence
from app.models.product import ProductCertification, ProductQuality


class PriceHistoryRead(BaseModel):
    id: int
    crop_id: int
    region_id: int
    price: float
    source: PriceSource
    external_source_name: str | None
    recorded_at: datetime

    class Config:
        from_attributes = True


class PriceForecastPoint(BaseModel):
    date: str
    predicted_price: float
    lower_bound: float
    upper_bound: float


class PriceForecastRead(BaseModel):
    status: str
    crop_id: int
    region_id: int
    data_points: int
    sources: list[str] = []
    forecast: list[PriceForecastPoint] = []
    weather_used: bool = False
    harvest_data_used: bool = False
    sensor_data_used: bool = False
    note: str | None = None


class DemandForecastPoint(BaseModel):
    date: str
    predicted_quantity: float
    lower_bound: float
    upper_bound: float


class DemandForecastRead(BaseModel):
    status: str
    crop_id: int
    region_id: int
    data_points: int
    forecast: list[DemandForecastPoint] = []
    note: str | None = None


class PriceSuggestionRequest(BaseModel):
    crop_id: int
    region_id: int
    quality: ProductQuality | None = None
    certification: ProductCertification = ProductCertification.NONE
    farm_id: int | None = None


class SuggestionFactor(BaseModel):
    label: str
    delta_pct: float


class PriceSuggestionRead(BaseModel):
    status: str
    suggestion_id: int | None = None
    crop_id: int
    region_id: int
    base_price: float | None = None
    suggested_price: float | None = None
    range_low: float | None = None
    range_high: float | None = None
    confidence: SuggestionConfidence | None = None
    factors: list[SuggestionFactor] = []
    price_forecast_status: str
    demand_forecast_status: str
    note: str | None = None

    class Config:
        from_attributes = True


class PriceSuggestionOutcome(BaseModel):
    id: int
    final_price: float | None
    farmer_action: FarmerAction

    class Config:
        from_attributes = True
