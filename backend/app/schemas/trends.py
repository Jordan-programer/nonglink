from pydantic import BaseModel


class TrendPoint(BaseModel):
    day: str
    value: float


class AdminTrends(BaseModel):
    new_users: list[TrendPoint]
    revenue: list[TrendPoint]
    new_orders: list[TrendPoint]
