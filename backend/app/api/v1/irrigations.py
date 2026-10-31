from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.farm import Farm
from app.models.irrigation import Irrigation, IrrigationStatus
from app.models.user import User
from app.schemas.irrigation import IrrigationCreate, IrrigationRead

router = APIRouter(tags=["irrigations"])


def _to_naive_utc(dt: datetime) -> datetime:
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


@router.post(
    "/farms/{farm_id}/irrigations",
    response_model=IrrigationRead,
    status_code=status.HTTP_201_CREATED,
)
def create_irrigation(
    farm_id: int,
    payload: IrrigationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm or farm.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found",
        )

    new_start = _to_naive_utc(payload.scheduled_time)
    new_end = new_start + timedelta(minutes=payload.duration_minutes)

    # Check conflict with any scheduled irrigation for the same farm
    scheduled_irrigations = (
        db.query(Irrigation)
        .filter(
            Irrigation.farm_id == farm_id,
            Irrigation.status == IrrigationStatus.AGENDADA,
        )
        .all()
    )

    for existing in scheduled_irrigations:
        ex_start = _to_naive_utc(existing.scheduled_time)
        ex_end = ex_start + timedelta(minutes=existing.duration_minutes)
        # Check interval overlap: [new_start, new_end) overlaps [ex_start, ex_end)
        if new_start < ex_end and ex_start < new_end:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Horário sobrepõe-se a outra rega agendada na mesma parcela.",
            )

    data = payload.model_dump()
    data["scheduled_time"] = new_start
    irrigation = Irrigation(**data, farm_id=farm_id)
    db.add(irrigation)
    db.commit()
    db.refresh(irrigation)
    return irrigation


@router.get("/irrigations/mine", response_model=list[IrrigationRead])
def list_my_irrigations(
    status_filter: IrrigationStatus | None = Query(default=None, alias="status"),
    from_time: datetime | None = Query(default=None, alias="from"),
    to_time: datetime | None = Query(default=None, alias="to"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(Irrigation)
        .join(Farm, Irrigation.farm_id == Farm.id)
        .filter(Farm.owner_id == current_user.id)
    )

    if status_filter is not None:
        query = query.filter(Irrigation.status == status_filter)

    if from_time is not None:
        query = query.filter(Irrigation.scheduled_time >= _to_naive_utc(from_time))

    if to_time is not None:
        query = query.filter(Irrigation.scheduled_time <= _to_naive_utc(to_time))

    query = query.order_by(Irrigation.scheduled_time.asc())
    return query.all()


@router.patch("/irrigations/{id}/cancel", response_model=IrrigationRead)
def cancel_irrigation(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    irrigation = (
        db.query(Irrigation)
        .join(Farm, Irrigation.farm_id == Farm.id)
        .filter(Irrigation.id == id)
        .first()
    )

    if not irrigation or irrigation.farm.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Irrigation not found",
        )

    if irrigation.status != IrrigationStatus.AGENDADA:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Apenas regas com estado 'agendada' podem ser canceladas.",
        )

    irrigation.status = IrrigationStatus.CANCELADA
    db.commit()
    db.refresh(irrigation)
    return irrigation
