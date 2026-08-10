from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.models.country import Country
from app.models.user import User
from app.schemas.country import CountryCreate, CountryRead

router = APIRouter(prefix="/countries", tags=["countries"])


@router.get("/", response_model=list[CountryRead])
def list_countries(db: Session = Depends(get_db)):
    return db.query(Country).order_by(Country.name).all()


@router.post("/", response_model=CountryRead)
def create_country(
    payload: CountryCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    country = Country(**payload.model_dump())
    db.add(country)
    db.commit()
    db.refresh(country)
    return country
