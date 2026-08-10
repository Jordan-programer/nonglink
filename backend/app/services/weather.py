from datetime import date, timedelta

import requests

ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
REQUEST_TIMEOUT = 5
MAX_REAL_FORECAST_DAYS = 16
CLIMATOLOGY_YEARS = 3

DAILY_VARS = "precipitation_sum,temperature_2m_mean"


def get_historical_weather(
    lat: float, lon: float, start_date: date, end_date: date
) -> dict[date, dict]:
    """Real daily precipitation/temperature for a date range, keyed by date.

    Returns an empty dict on any network/API failure — callers must treat
    missing weather as "unknown", not as zero.
    """
    try:
        res = requests.get(
            ARCHIVE_URL,
            params={
                "latitude": lat,
                "longitude": lon,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "daily": DAILY_VARS,
                "timezone": "auto",
            },
            timeout=REQUEST_TIMEOUT,
        )
        res.raise_for_status()
        return _parse_daily(res.json())
    except (requests.RequestException, ValueError, KeyError):
        return {}


def get_forecast_weather(lat: float, lon: float, days: int) -> dict[date, dict]:
    """Real weather forecast, capped at Open-Meteo's ~16 real forecast days."""
    days = min(days, MAX_REAL_FORECAST_DAYS)
    try:
        res = requests.get(
            FORECAST_URL,
            params={
                "latitude": lat,
                "longitude": lon,
                "daily": DAILY_VARS,
                "forecast_days": days,
                "timezone": "auto",
            },
            timeout=REQUEST_TIMEOUT,
        )
        res.raise_for_status()
        return _parse_daily(res.json())
    except (requests.RequestException, ValueError, KeyError):
        return {}


def get_climatological_average(lat: float, lon: float, month: int) -> dict | None:
    """Real historical average precipitation/temperature for a calendar
    month, averaged over the last few years — used for forecast days beyond
    Open-Meteo's real forecast horizon. Never a fabricated value; if the
    archive lookup fails, returns None and callers treat it as unknown.
    """
    today = date.today()
    end = date(today.year - 1, 12, 31)
    start = date(end.year - CLIMATOLOGY_YEARS + 1, 1, 1)

    history = get_historical_weather(lat, lon, start, end)
    if not history:
        return None

    month_rows = [v for d, v in history.items() if d.month == month]
    if not month_rows:
        return None

    return {
        "precipitation": sum(r["precipitation"] for r in month_rows) / len(month_rows),
        "temperature": sum(r["temperature"] for r in month_rows) / len(month_rows),
    }


def _parse_daily(payload: dict) -> dict[date, dict]:
    daily = payload["daily"]
    dates = daily["time"]
    precip = daily["precipitation_sum"]
    temp = daily["temperature_2m_mean"]

    result: dict[date, dict] = {}
    for i, d in enumerate(dates):
        p = precip[i] if i < len(precip) else None
        t = temp[i] if i < len(temp) else None
        if p is None or t is None:
            continue
        result[date.fromisoformat(d)] = {"precipitation": float(p), "temperature": float(t)}
    return result
