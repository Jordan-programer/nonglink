from pydantic import BaseModel


class EarningsSummary(BaseModel):
    gross_sales: float
    commission_rate: float
    commission: float
    available_balance: float
