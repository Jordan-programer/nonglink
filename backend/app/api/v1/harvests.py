from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.farm import Farm
from app.models.harvest import Harvest
from app.models.user import User
from app.schemas.harvest import HarvestCreate, HarvestRead, HarvestUpdate

router = APIRouter(prefix="/harvests", tags=["harvests"])


def _get_owned_harvest(db: Session, harvest_id: int, current_user: User) -> Harvest:
    harvest = db.query(Harvest).get(harvest_id)
    if not harvest or harvest.farm.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Harvest not found")
    return harvest


@router.post("/", response_model=HarvestRead)
def create_harvest(
    payload: HarvestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = db.query(Farm).get(payload.farm_id)
    if not farm or farm.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Farm not found")

    harvest = Harvest(**payload.model_dump())
    db.add(harvest)
    db.commit()
    db.refresh(harvest)
    return harvest


@router.get("/mine", response_model=list[HarvestRead])
def list_my_harvests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Harvest)
        .join(Farm, Harvest.farm_id == Farm.id)
        .filter(Farm.owner_id == current_user.id)
        .order_by(Harvest.expected_harvest_at)
        .all()
    )


@router.patch("/{harvest_id}", response_model=HarvestRead)
def update_harvest(
    harvest_id: int,
    payload: HarvestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    harvest = _get_owned_harvest(db, harvest_id, current_user)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(harvest, field, value)

    db.commit()
    db.refresh(harvest)
    return harvest
