from datetime import datetime

from pydantic import BaseModel


class RouteCreate(BaseModel):
    origin_region_id: int
    destination_region_id: int


class RouteRead(BaseModel):
    id: int
    origin_region_id: int
    origin_region_name: str
    destination_region_id: int
    destination_region_name: str
    created_at: datetime

    class Config:
        from_attributes = True


class PopularRouteRead(BaseModel):
    origin_region_id: int
    origin_region_name: str
    destination_region_id: int
    destination_region_name: str
    order_count: int
