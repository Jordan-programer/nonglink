from pydantic import BaseModel


class FarmBase(BaseModel):
    name: str
    location: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    size_hectares: float | None = None
    region_id: int | None = None


class FarmCreate(FarmBase):
    pass


class FarmUpdate(BaseModel):
    name: str | None = None
    location: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    size_hectares: float | None = None
    region_id: int | None = None


class FarmRead(FarmBase):
    id: int
    owner_id: int

    class Config:
        from_attributes = True


class FarmAdminRead(FarmRead):
    owner_name: str
