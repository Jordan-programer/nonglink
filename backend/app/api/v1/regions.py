from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.models.region import Region
from app.models.user import User
from app.schemas.region import RegionCreate, RegionRead

router = APIRouter(prefix="/regions", tags=["regions"])


@router.get("/", response_model=list[RegionRead])
def list_regions(
    country_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Region)
    if country_id is not None:
        query = query.filter(Region.country_id == country_id)
    return query.order_by(Region.name).all()


@router.post("/", response_model=RegionRead)
def create_region(
    payload: RegionCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    region = Region(**payload.model_dump())
    db.add(region)
    db.commit()
    db.refresh(region)
    return region
