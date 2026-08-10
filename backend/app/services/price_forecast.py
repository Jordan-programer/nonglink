from datetime import date, timedelta
import math

import numpy as np
from xgboost import XGBRegressor
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.farm import Farm
from app.models.harvest import Harvest
from app.models.price_history import PriceHistory
from app.models.region import Region
from app.models.sensor import Sensor, SensorReading, SensorType
from app.services import weather as weather_service

MIN_DATA_POINTS = 20
ROLLING_WINDOW = 5
LAG_LONG = 7
NO_HARVEST_SENTINEL_DAYS = 365.0
MAX_REAL_FORECAST_DAYS = 16
SOIL_MOISTURE_WINDOW_DAYS = 7
NO_SENSOR_SENTINEL = 0.0


def _month_seasonality(month: int) -> tuple[float, float]:
    return math.sin(2 * math.pi * month / 12), math.cos(2 * math.pi * month / 12)


def _days_to_next_harvest(db: Session, crop_id: int, region_id: int, on_date: date) -> tuple[float, int]:
    """Days until the nearest upcoming logged harvest for this crop+region.

    harvests is empty today (no farmer has logged a safra yet), so this
    returns the sentinel + harvest_known=0 almost always right now — the
    feature is wired up and ready for when real harvest data exists.
    """
    harvest = (
        db.query(Harvest)
        .join(Farm, Harvest.farm_id == Farm.id)
        .filter(
            Harvest.crop_id == crop_id,
            Farm.region_id == region_id,
            Harvest.expected_harvest_at >= on_date,
        )
        .order_by(Harvest.expected_harvest_at)
        .first()
    )
    if harvest is None:
        return NO_HARVEST_SENTINEL_DAYS, 0
    return float((harvest.expected_harvest_at - on_date).days), 1


def _soil_moisture_for_region(
    db: Session, region_id: int, as_of_date: date, window_days: int = SOIL_MOISTURE_WINDOW_DAYS
) -> tuple[float, int]:
    """Mean soil_moisture reading across the region's farms in the trailing
    window — an extra real-world variable feeding the price model, per the
    Fase 4 IoT integration. Almost always "unknown" today since very few
    sensors have real readings yet; wired up and ready as adoption grows.
    """
    window_start = as_of_date - timedelta(days=window_days)
    avg_value = (
        db.query(func.avg(SensorReading.value))
        .join(Sensor, SensorReading.sensor_id == Sensor.id)
        .join(Farm, Sensor.farm_id == Farm.id)
        .filter(
            Farm.region_id == region_id,
            Sensor.type == SensorType.SOIL_MOISTURE,
            SensorReading.recorded_at >= window_start,
            SensorReading.recorded_at <= as_of_date + timedelta(days=1),
        )
        .scalar()
    )
    if avg_value is None:
        return NO_SENSOR_SENTINEL, 0
    return float(avg_value), 1


def _feature_row(
    *, day_offset: int, target_date: date, lag_1: float, lag_7: float,
    rolling_mean: float, precipitation: float, temperature: float,
    days_to_harvest: float, harvest_known: int, soil_moisture: float, sensor_known: int,
) -> list[float]:
    m_sin, m_cos = _month_seasonality(target_date.month)
    return [
        day_offset, m_sin, m_cos, lag_1, lag_7, rolling_mean,
        precipitation, temperature, days_to_harvest, harvest_known,
        soil_moisture, sensor_known,
    ]


def forecast_price(
    db: Session, *, crop_id: int, region_id: int, horizon_days: int = 30
) -> dict:
    """Forecast price for a crop+region pair from real data only: price
    history (lags, rolling mean), real weather (historical/forecast/
    climatological — never fabricated), and logged harvest proximity.

    Returns status="insufficient_data" (no fabricated numbers) when there
    isn't enough real history to fit a model.
    """
    rows = (
        db.query(PriceHistory)
        .filter(PriceHistory.crop_id == crop_id, PriceHistory.region_id == region_id)
        .order_by(PriceHistory.recorded_at)
        .all()
    )
    sources = sorted({row.external_source_name or row.source.value for row in rows})

    if len(rows) < MIN_DATA_POINTS:
        return {
            "status": "insufficient_data",
            "crop_id": crop_id,
            "region_id": region_id,
            "data_points": len(rows),
            "sources": sources,
            "forecast": [],
            "weather_used": False,
            "harvest_data_used": False,
            "sensor_data_used": False,
            "note": (
                f"Menos de {MIN_DATA_POINTS} pontos de histórico real para esta "
                "cultura/região — sem dados suficientes para prever, sem previsão "
                "inventada."
            ),
        }

    region = db.query(Region).get(region_id)
    has_coords = region is not None and region.latitude is not None and region.longitude is not None

    dates = [r.recorded_at.date() for r in rows]
    prices = [r.price for r in rows]
    first_date = dates[0]
    last_date = dates[-1]
    last_offset = (last_date - first_date).days

    today = date.today()
    horizon_end_date = last_date + timedelta(days=horizon_days)

    weather_by_date: dict[date, dict] = {}
    forecast_weather: dict[date, dict] = {}
    climatology_cache: dict[int, dict | None] = {}
    weather_used = False

    if has_coords:
        historical_end = min(horizon_end_date, today - timedelta(days=1))
        if historical_end >= first_date:
            weather_by_date = weather_service.get_historical_weather(
                region.latitude, region.longitude, first_date, historical_end
            )
        if horizon_end_date >= today:
            real_forecast_days = min(
                (horizon_end_date - today).days + 1, MAX_REAL_FORECAST_DAYS
            )
            if real_forecast_days > 0:
                forecast_weather = weather_service.get_forecast_weather(
                    region.latitude, region.longitude, real_forecast_days
                )

    def weather_for(d: date) -> dict | None:
        nonlocal weather_used
        w = weather_by_date.get(d) or forecast_weather.get(d)
        if w:
            weather_used = True
            return w
        if not has_coords:
            return None
        if d.month not in climatology_cache:
            climatology_cache[d.month] = weather_service.get_climatological_average(
                region.latitude, region.longitude, d.month
            )
        avg = climatology_cache[d.month]
        if avg:
            weather_used = True
        return avg

    # --- training features, one row per real observation ---
    harvest_data_used = False
    sensor_data_used = False
    features = []
    for i, d in enumerate(dates):
        lag_1 = prices[i - 1] if i >= 1 else prices[i]
        lag_7 = prices[i - LAG_LONG] if i >= LAG_LONG else lag_1
        window = prices[max(0, i - ROLLING_WINDOW):i] or [prices[i]]
        rolling_mean = sum(window) / len(window)

        w = weather_for(d)
        precipitation = w["precipitation"] if w else 0.0
        temperature = w["temperature"] if w else 0.0

        days_h, harvest_known = _days_to_next_harvest(db, crop_id, region_id, d)
        if harvest_known:
            harvest_data_used = True

        soil_moisture, sensor_known = _soil_moisture_for_region(db, region_id, d)
        if sensor_known:
            sensor_data_used = True

        features.append(
            _feature_row(
                day_offset=(d - first_date).days, target_date=d, lag_1=lag_1,
                lag_7=lag_7, rolling_mean=rolling_mean, precipitation=precipitation,
                temperature=temperature, days_to_harvest=days_h,
                harvest_known=harvest_known, soil_moisture=soil_moisture,
                sensor_known=sensor_known,
            )
        )

    X = np.array(features, dtype=float)
    y = np.array(prices, dtype=float)

    model = XGBRegressor(
        max_depth=3, n_estimators=100, learning_rate=0.1,
        objective="reg:squarederror",
    )
    model.fit(X, y)

    residuals = y - model.predict(X)
    residual_std = float(np.std(residuals)) if len(residuals) > 1 else 0.0

    # --- recursive forecast: each day's prediction feeds the next day's lags ---
    # Sensors report current conditions, not a forecast of their own, so the
    # same latest reading is reused across the whole horizon.
    forecast_soil_moisture, forecast_sensor_known = _soil_moisture_for_region(db, region_id, today)
    if forecast_sensor_known:
        sensor_data_used = True

    history_prices = list(prices)
    step = max(horizon_days // 6, 1)
    forecast = []

    for day_ahead in range(1, horizon_days + 1):
        target_date = last_date + timedelta(days=day_ahead)
        lag_1 = history_prices[-1]
        lag_7 = history_prices[-LAG_LONG] if len(history_prices) >= LAG_LONG else lag_1
        window = history_prices[-ROLLING_WINDOW:]
        rolling_mean = sum(window) / len(window)

        w = weather_for(target_date)
        precipitation = w["precipitation"] if w else 0.0
        temperature = w["temperature"] if w else 0.0

        days_h, harvest_known = _days_to_next_harvest(db, crop_id, region_id, target_date)
        if harvest_known:
            harvest_data_used = True

        point_features = np.array(
            [_feature_row(
                day_offset=last_offset + day_ahead, target_date=target_date,
                lag_1=lag_1, lag_7=lag_7, rolling_mean=rolling_mean,
                precipitation=precipitation, temperature=temperature,
                days_to_harvest=days_h, harvest_known=harvest_known,
                soil_moisture=forecast_soil_moisture, sensor_known=forecast_sensor_known,
            )]
        )
        predicted = max(float(model.predict(point_features)[0]), 0.0)
        history_prices.append(predicted)  # feeds the next iteration's lags/rolling mean

        if day_ahead % step == 0 or day_ahead == horizon_days:
            band = residual_std * (1 + day_ahead / horizon_days)
            forecast.append(
                {
                    "date": target_date.isoformat(),
                    "predicted_price": round(predicted, 2),
                    "lower_bound": round(max(predicted - band, 0), 2),
                    "upper_bound": round(predicted + band, 2),
                }
            )

    return {
        "status": "ok",
        "crop_id": crop_id,
        "region_id": region_id,
        "data_points": len(rows),
        "sources": sources,
        "forecast": forecast,
        "weather_used": weather_used,
        "harvest_data_used": harvest_data_used,
        "sensor_data_used": sensor_data_used,
        "note": (
            "Modelo XGBoost com lags de preço, clima real e proximidade de "
            "colheita, treinado apenas com dados reais — sem dados sintéticos. "
            "Previsão recursiva: cada dia alimenta a previsão do dia seguinte, "
            "por isso a incerteza cresce com o horizonte."
        ),
    }
