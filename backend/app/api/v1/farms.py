from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.core.database import get_db
from app.models.farm import Farm
from app.models.user import User
from app.schemas.farm import FarmAdminRead, FarmCreate, FarmRead, FarmUpdate

router = APIRouter(prefix="/farms", tags=["farms"])


@router.post("/", response_model=FarmRead)
def create_farm(
    payload: FarmCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = payload.model_dump()
    if data.get("region_id") is None:
        data["region_id"] = current_user.region_id

    farm = Farm(**data, owner_id=current_user.id)
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm


@router.get("/", response_model=list[FarmAdminRead])
def list_all_farms(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return db.query(Farm).order_by(Farm.id).all()


@router.get("/mine", response_model=list[FarmRead])
def list_my_farms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Farm).filter(Farm.owner_id == current_user.id).all()


@router.patch("/{farm_id}", response_model=FarmRead)
def update_farm(
    farm_id: int,
    payload: FarmUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = db.query(Farm).get(farm_id)
    if not farm or farm.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Farm not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(farm, field, value)

    db.commit()
    db.refresh(farm)
    return farm
