BASE_FARE = 500.0  # Kz
PER_KM_RATE = 150.0  # Kz per km
PER_KG_RATE = 20.0  # Kz per kg


def calculate_delivery_fee(distance_km: float, weight_kg: float) -> float:
    """preco = tarifa_base + (distancia_km * tarifa_km) + (peso_kg * tarifa_kg).
    Rates are code constants for Phase 1, same pattern as
    PLATFORM_COMMISSION_RATE in earnings.py — not admin-configurable yet."""
    fee = BASE_FARE + (distance_km * PER_KM_RATE) + (weight_kg * PER_KG_RATE)
    return round(fee, 2)
