from sqlalchemy.orm import Session

from app.models.farm import Farm
from app.models.price_suggestion import FarmerAction, PriceSuggestion, SuggestionConfidence
from app.models.product import Product, ProductCertification, ProductQuality
from app.services.demand_forecast import forecast_demand
from app.services.price_forecast import forecast_price

SAFETY_BOUND_PCT = 0.25
OVERSUPPLY_THRESHOLD = 2
OVERSUPPLY_STEP_PCT = 0.02
OVERSUPPLY_MAX_PCT = 0.10
NO_SUPPLY_BONUS_PCT = 0.03
QUALITY_ADJUSTMENTS = {ProductQuality.A: 0.05, ProductQuality.B: 0.0, ProductQuality.C: -0.05}
CERTIFICATION_ADJUSTMENTS = {
    ProductCertification.ORGANIC: 0.08,
    ProductCertification.IN_TRANSITION: 0.03,
    ProductCertification.NONE: 0.0,
}
DEMAND_TREND_THRESHOLD = 0.10
DEMAND_TREND_PCT = 0.02


def suggest_price(
    db: Session,
    *,
    crop_id: int,
    region_id: int,
    quality: ProductQuality | None = None,
    certification: ProductCertification = ProductCertification.NONE,
    farm_id: int | None = None,
) -> dict:
    """Combine the real price + demand forecasts with business rules into an
    explainable suggested price. Every call is logged (accepted/adjusted
    tracked later when the farmer actually saves a product), per the
    original plan's feedback-loop requirement.

    Never fabricates a price: if the underlying price forecast doesn't have
    enough real data, this returns status="insufficient_data" too.
    """
    price_result = forecast_price(db, crop_id=crop_id, region_id=region_id, horizon_days=7)

    if price_result["status"] != "ok":
        return {
            "status": "insufficient_data",
            "suggestion_id": None,
            "crop_id": crop_id,
            "region_id": region_id,
            "price_forecast_status": price_result["status"],
            "demand_forecast_status": "not_checked",
            "note": (
                "Sem previsão de preço real disponível para esta cultura/região "
                "ainda — sem dados suficientes para sugerir um preço."
            ),
        }

    base_price = price_result["forecast"][0]["predicted_price"]
    lower = price_result["forecast"][0]["lower_bound"]
    upper = price_result["forecast"][0]["upper_bound"]

    factors: list[dict] = []
    price = base_price

    # --- demand trend (best-effort; skipped gracefully if data is thin) ---
    demand_result = forecast_demand(db, crop_id=crop_id, region_id=region_id, horizon_days=30)
    if demand_result["status"] == "ok" and len(demand_result["forecast"]) >= 2:
        first_q = demand_result["forecast"][0]["predicted_quantity"]
        last_q = demand_result["forecast"][-1]["predicted_quantity"]
        if first_q > 0:
            change = (last_q - first_q) / first_q
            if change > DEMAND_TREND_THRESHOLD:
                price *= 1 + DEMAND_TREND_PCT
                factors.append({"label": "Demanda prevista em alta", "delta_pct": DEMAND_TREND_PCT * 100})
            elif change < -DEMAND_TREND_THRESHOLD:
                price *= 1 - DEMAND_TREND_PCT
                factors.append({"label": "Demanda prevista em queda", "delta_pct": -DEMAND_TREND_PCT * 100})

    # --- current marketplace supply ---
    supply_query = (
        db.query(Product)
        .join(Farm, Product.farm_id == Farm.id)
        .filter(
            Product.crop_id == crop_id,
            Farm.region_id == region_id,
            Product.quantity_available > 0,
        )
    )
    if farm_id is not None:
        supply_query = supply_query.filter(Product.farm_id != farm_id)
    competing_listings = supply_query.count()

    if competing_listings == 0:
        price *= 1 + NO_SUPPLY_BONUS_PCT
        factors.append({"label": "Sem concorrência direta na região", "delta_pct": NO_SUPPLY_BONUS_PCT * 100})
    elif competing_listings > OVERSUPPLY_THRESHOLD:
        over = competing_listings - OVERSUPPLY_THRESHOLD
        pct = min(over * OVERSUPPLY_STEP_PCT, OVERSUPPLY_MAX_PCT)
        price *= 1 - pct
        factors.append(
            {
                "label": f"Oferta atual acima da média ({competing_listings} produtos semelhantes)",
                "delta_pct": -pct * 100,
            }
        )

    # --- declared quality ---
    if quality is not None:
        pct = QUALITY_ADJUSTMENTS[quality]
        if pct != 0:
            price *= 1 + pct
        factors.append({"label": f"Qualidade declarada {quality.value}", "delta_pct": pct * 100})

    # --- certification ---
    pct = CERTIFICATION_ADJUSTMENTS[certification]
    if pct != 0:
        price *= 1 + pct
        label = "Certificação orgânica" if certification == ProductCertification.ORGANIC else "Em transição para orgânico"
        factors.append({"label": label, "delta_pct": pct * 100})

    # --- safety bound: never stray too far from the forecasted market price ---
    floor = base_price * (1 - SAFETY_BOUND_PCT)
    ceiling = base_price * (1 + SAFETY_BOUND_PCT)
    if price < floor or price > ceiling:
        price = max(floor, min(price, ceiling))
        factors.append({"label": "Ajustado para não se afastar do preço de mercado previsto", "delta_pct": 0.0})

    suggested_price = round(max(price, 0), 2)

    # apply the forecast's own relative uncertainty band to the adjusted price
    band_ratio_low = lower / base_price if base_price else 1.0
    band_ratio_high = upper / base_price if base_price else 1.0
    range_low = round(max(suggested_price * band_ratio_low, 0), 2)
    range_high = round(suggested_price * band_ratio_high, 2)

    band_width_ratio = (upper - lower) / base_price if base_price else 1.0
    if band_width_ratio < 0.10:
        confidence = SuggestionConfidence.ALTA
    elif band_width_ratio < 0.25:
        confidence = SuggestionConfidence.MEDIA
    else:
        confidence = SuggestionConfidence.BAIXA

    suggestion = PriceSuggestion(
        crop_id=crop_id,
        region_id=region_id,
        quality=quality,
        certification=certification,
        base_price=round(base_price, 2),
        suggested_price=suggested_price,
        range_low=range_low,
        range_high=range_high,
        confidence=confidence,
        factors=factors,
        price_forecast_status=price_result["status"],
        demand_forecast_status=demand_result["status"],
    )
    db.add(suggestion)
    db.commit()
    db.refresh(suggestion)

    return {
        "status": "ok",
        "suggestion_id": suggestion.id,
        "crop_id": crop_id,
        "region_id": region_id,
        "base_price": suggestion.base_price,
        "suggested_price": suggested_price,
        "range_low": range_low,
        "range_high": range_high,
        "confidence": confidence,
        "factors": factors,
        "price_forecast_status": price_result["status"],
        "demand_forecast_status": demand_result["status"],
        "note": (
            "Sugestão calculada a partir da previsão de preço real e ajustada por "
            "regras de negócio explicáveis — não é um valor fixo, podes sempre "
            "sobrescrever."
        ),
    }
