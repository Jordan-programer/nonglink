from pydantic import BaseModel


class RegionBase(BaseModel):
    name: str
    country_id: int
    latitude: float | None = None
    longitude: float | None = None


class RegionCreate(RegionBase):
    pass


class RegionRead(RegionBase):
    id: int
    country_name: str

    class Config:
        from_attributes = True
