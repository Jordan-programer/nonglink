from pydantic import BaseModel


class PaymentMethodRead(BaseModel):
    id: int
    name: str
    code: str

    class Config:
        from_attributes = True
