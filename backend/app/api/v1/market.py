from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.price_history import PriceHistory
from app.schemas.market import (
    DemandForecastRead,
    PriceForecastRead,
    PriceHistoryRead,
    PriceSuggestionRead,
    PriceSuggestionRequest,
)
from app.services.demand_forecast import forecast_demand
from app.services.price_forecast import forecast_price
from app.services.price_suggestion import suggest_price

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/prices", response_model=list[PriceHistoryRead])
def list_prices(
    crop_id: int = Query(...),
    region_id: int = Query(...),
    db: Session = Depends(get_db),
):
    return (
        db.query(PriceHistory)
        .filter(PriceHistory.crop_id == crop_id, PriceHistory.region_id == region_id)
        .order_by(PriceHistory.recorded_at)
        .all()
    )


@router.get("/price-forecast", response_model=PriceForecastRead)
def price_forecast(
    crop_id: int = Query(...),
    region_id: int = Query(...),
    horizon_days: int = Query(30, ge=1, le=90),
    db: Session = Depends(get_db),
):
    return forecast_price(
        db, crop_id=crop_id, region_id=region_id, horizon_days=horizon_days
    )


@router.get("/demand-forecast", response_model=DemandForecastRead)
def demand_forecast(
    crop_id: int = Query(...),
    region_id: int = Query(...),
    horizon_days: int = Query(30, ge=1, le=90),
    db: Session = Depends(get_db),
):
    return forecast_demand(
        db, crop_id=crop_id, region_id=region_id, horizon_days=horizon_days
    )


@router.post("/price-suggestions", response_model=PriceSuggestionRead)
def price_suggestion(
    payload: PriceSuggestionRequest,
    db: Session = Depends(get_db),
):
    return suggest_price(
        db,
        crop_id=payload.crop_id,
        region_id=payload.region_id,
        quality=payload.quality,
        certification=payload.certification,
        farm_id=payload.farm_id,
    )
