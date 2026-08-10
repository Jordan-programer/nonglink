from pydantic import BaseModel

from app.models.crop import CropCategory


class CropBase(BaseModel):
    name: str
    category: CropCategory = CropCategory.OUTROS
    default_unit: str = "kg"


class CropCreate(CropBase):
    pass


class CropRead(CropBase):
    id: int

    class Config:
        from_attributes = True
