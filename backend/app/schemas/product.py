from pydantic import BaseModel


class ProductBase(BaseModel):
    name: str
    description: str | None = None
    category: str | None = None
    unit: str = "kg"
    price_per_unit: float
    quantity_available: float = 0


class ProductCreate(ProductBase):
    farm_id: int


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    category: str | None = None
    unit: str | None = None
    price_per_unit: float | None = None
    quantity_available: float | None = None


class ProductRead(ProductBase):
    id: int
    farm_id: int

    class Config:
        from_attributes = True
