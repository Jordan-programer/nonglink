from pydantic import BaseModel

from app.models.product import ProductCertification, ProductQuality


class ProductBase(BaseModel):
    name: str
    description: str | None = None
    image_url: str | None = None
    crop_id: int
    unit: str = "kg"
    price_per_unit: float
    quantity_available: float = 0
    quality: ProductQuality | None = None
    certification: ProductCertification = ProductCertification.NONE


class ProductCreate(ProductBase):
    farm_id: int
    price_suggestion_id: int | None = None


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    image_url: str | None = None
    crop_id: int | None = None
    unit: str | None = None
    price_per_unit: float | None = None
    quantity_available: float | None = None
    quality: ProductQuality | None = None
    certification: ProductCertification | None = None
    price_suggestion_id: int | None = None


class ProductRead(ProductBase):
    id: int
    farm_id: int
    crop_name: str
    crop_category: str
    farm_name: str
    farm_owner_id: int
    farm_owner_name: str

    class Config:
        from_attributes = True


class ImageUploadResponse(BaseModel):
    image_url: str
