from collections import defaultdict
from datetime import timedelta
import math

import numpy as np
from sklearn.linear_model import Ridge
from sqlalchemy.orm import Session

from app.models.farm import Farm
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product

MIN_DATA_POINTS = 6


def forecast_demand(
    db: Session, *, crop_id: int, region_id: int, horizon_days: int = 30
) -> dict:
    """Forecast daily traded quantity for a crop+region pair from real orders only.

    Region is the selling farm's region, matching price_history's convention,
    so the same crop+region pair yields both a price and a demand forecast.
    Cancelled orders are excluded — they never became real demand. Returns
    status="insufficient_data" (no fabricated numbers) when there isn't
    enough real transaction history to fit a model — expected today, since
    AgriLink has very few real orders yet and no external dataset can
    substitute marketplace-specific transaction volume.
    """
    rows = (
        db.query(Order.created_at, OrderItem.quantity)
        .join(OrderItem, OrderItem.order_id == Order.id)
        .join(Product, OrderItem.product_id == Product.id)
        .join(Farm, Product.farm_id == Farm.id)
        .filter(
            Product.crop_id == crop_id,
            Farm.region_id == region_id,
            Order.status != OrderStatus.CANCELLED,
        )
        .all()
    )

    daily_totals: dict = defaultdict(float)
    for created_at, quantity in rows:
        daily_totals[created_at.date()] += quantity

    days = sorted(daily_totals.keys())

    if len(days) < MIN_DATA_POINTS:
        return {
            "status": "insufficient_data",
            "crop_id": crop_id,
            "region_id": region_id,
            "data_points": len(days),
            "forecast": [],
            "note": (
                "Menos de "
                f"{MIN_DATA_POINTS} dias com encomendas reais para esta cultura/região "
                "— sem dados suficientes para prever, sem previsão inventada."
            ),
        }

    first_day = days[0]
    x_offset = np.array([(d - first_day).days for d in days], dtype=float)
    weekday = np.array([d.weekday() for d in days], dtype=float)
    features = np.column_stack(
        [x_offset, np.sin(2 * math.pi * weekday / 7), np.cos(2 * math.pi * weekday / 7)]
    )
    y = np.array([daily_totals[d] for d in days], dtype=float)

    model = Ridge(alpha=1.0)
    model.fit(features, y)

    residuals = y - model.predict(features)
    residual_std = float(np.std(residuals)) if len(residuals) > 1 else 0.0

    last_day = days[-1]
    last_offset = (last_day - first_day).days

    forecast = []
    step = max(horizon_days // 6, 1)
    for day_ahead in range(step, horizon_days + 1, step):
        target_date = last_day + timedelta(days=day_ahead)
        offset = last_offset + day_ahead
        point_features = np.array(
            [[
                offset,
                math.sin(2 * math.pi * target_date.weekday() / 7),
                math.cos(2 * math.pi * target_date.weekday() / 7),
            ]]
        )
        predicted = float(model.predict(point_features)[0])
        band = residual_std * (1 + day_ahead / horizon_days)
        forecast.append(
            {
                "date": target_date.isoformat(),
                "predicted_quantity": round(max(predicted, 0), 2),
                "lower_bound": round(max(predicted - band, 0), 2),
                "upper_bound": round(predicted + band, 2),
            }
        )

    return {
        "status": "ok",
        "crop_id": crop_id,
        "region_id": region_id,
        "data_points": len(days),
        "forecast": forecast,
        "note": (
            "Modelo simples (regressão linear com sazonalidade semanal) treinado apenas "
            "com encomendas reais — sem dados sintéticos. Precisão limitada pelo volume "
            "de transações disponível."
        ),
    }
