from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.models.crop import Crop
from app.models.user import User
from app.schemas.crop import CropCreate, CropRead

router = APIRouter(prefix="/crops", tags=["crops"])


@router.get("/", response_model=list[CropRead])
def list_crops(db: Session = Depends(get_db)):
    return db.query(Crop).order_by(Crop.name).all()


@router.post("/", response_model=CropRead)
def create_crop(
    payload: CropCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    crop = Crop(**payload.model_dump())
    db.add(crop)
    db.commit()
    db.refresh(crop)
    return crop
