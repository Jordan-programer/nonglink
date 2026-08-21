from pydantic import BaseModel


class BrowserSafeClientId(BaseModel):
    client_id: str
    sdk_url: str
    environment: str


class CreatePayPalOrderRequest(BaseModel):
    order_id: int


class PayPalOrderResponse(BaseModel):
    id: str
    status: str
