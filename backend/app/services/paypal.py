import base64
import time

import requests

from app.core.config import settings

_BASE_URLS = {
    "sandbox": "https://api-m.sandbox.paypal.com",
    "live": "https://api-m.paypal.com",
}

# Cached in-process; fine for a single-worker dev/small-deployment setup —
# a multi-worker deployment would want this in shared storage (e.g. Redis).
_token_cache: dict = {"token": None, "expires_at": 0.0}


class PayPalError(Exception):
    pass


def _base_url() -> str:
    return _BASE_URLS.get(settings.PAYPAL_MODE, _BASE_URLS["sandbox"])


def sdk_url() -> str:
    host = "www.sandbox.paypal.com" if settings.PAYPAL_MODE != "live" else "www.paypal.com"
    return f"https://{host}/web-sdk/v6/core"


def _get_access_token() -> str:
    now = time.time()
    if _token_cache["token"] and now < _token_cache["expires_at"]:
        return _token_cache["token"]

    credentials = f"{settings.PAYPAL_CLIENT_ID}:{settings.PAYPAL_CLIENT_SECRET}".encode()
    auth = base64.b64encode(credentials).decode()

    try:
        resp = requests.post(
            f"{_base_url()}/v1/oauth2/token",
            headers={
                "Authorization": f"Basic {auth}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={"grant_type": "client_credentials"},
            timeout=15,
        )
        resp.raise_for_status()
    except requests.RequestException as exc:
        raise PayPalError(f"Failed to authenticate with PayPal: {exc}") from exc

    data = resp.json()
    _token_cache["token"] = data["access_token"]
    _token_cache["expires_at"] = now + data.get("expires_in", 300) - 30
    return _token_cache["token"]


def kz_to_usd(amount_kz: float) -> str:
    amount_usd = amount_kz / settings.PAYPAL_USD_EXCHANGE_RATE
    return f"{amount_usd:.2f}"


def create_order(amount_kz: float, custom_id: str) -> dict:
    token = _get_access_token()
    try:
        resp = requests.post(
            f"{_base_url()}/v2/checkout/orders",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json={
                "intent": "CAPTURE",
                "purchase_units": [
                    {
                        "custom_id": custom_id,
                        "amount": {
                            "currency_code": "USD",
                            "value": kz_to_usd(amount_kz),
                        },
                    }
                ],
            },
            timeout=15,
        )
        resp.raise_for_status()
    except requests.RequestException as exc:
        raise PayPalError(f"Failed to create PayPal order: {exc}") from exc

    return resp.json()


def capture_order(paypal_order_id: str) -> dict:
    token = _get_access_token()
    try:
        resp = requests.post(
            f"{_base_url()}/v2/checkout/orders/{paypal_order_id}/capture",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            timeout=15,
        )
        resp.raise_for_status()
    except requests.RequestException as exc:
        raise PayPalError(f"Failed to capture PayPal order: {exc}") from exc

    return resp.json()
