from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.payment_method import PaymentMethod
from app.models.user import User
from app.schemas.payment_method import PaymentMethodRead

router = APIRouter(prefix="/payment-methods", tags=["payment-methods"])


@router.get("/", response_model=list[PaymentMethodRead])
def list_payment_methods(
    country_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(PaymentMethod)
    if country_id is not None:
        query = query.filter(PaymentMethod.countries.any(id=country_id))
    return query.order_by(PaymentMethod.name).all()


@router.get("/mine", response_model=list[PaymentMethodRead])
def list_my_payment_methods(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.region:
        return db.query(PaymentMethod).order_by(PaymentMethod.name).all()

    return (
        db.query(PaymentMethod)
        .filter(PaymentMethod.countries.any(id=current_user.region.country_id))
        .order_by(PaymentMethod.name)
        .all()
    )
