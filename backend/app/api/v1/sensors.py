import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.farm import Farm
from app.models.sensor import Sensor, SensorAlert, SensorReading
from app.models.user import User
from app.schemas.sensor import (
    SensorAlertRead,
    SensorCreate,
    SensorCreateResponse,
    SensorDailyAggregate,
    SensorRead,
    SensorReadingCreate,
    SensorReadingRead,
)
from app.services.sensor_ingest import authenticate_device, record_reading

router = APIRouter(prefix="/sensors", tags=["sensors"])


@router.post("/", response_model=SensorCreateResponse)
def create_sensor(
    payload: SensorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = db.query(Farm).get(payload.farm_id)
    if not farm or farm.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Farm not found")

    sensor = Sensor(**payload.model_dump(), device_key=secrets.token_hex(24))
    db.add(sensor)
    db.commit()
    db.refresh(sensor)
    return sensor


@router.get("/", response_model=list[SensorRead])
def list_sensors(db: Session = Depends(get_db)):
    return db.query(Sensor).all()


@router.post("/readings", response_model=SensorReadingRead)
def ingest_reading(payload: SensorReadingCreate, db: Session = Depends(get_db)):
    sensor = authenticate_device(db, sensor_id=payload.sensor_id, device_key=payload.device_key)
    if not sensor:
        raise HTTPException(status_code=401, detail="Unknown sensor or invalid device key")

    return record_reading(db, sensor=sensor, value=payload.value)


@router.get("/{sensor_id}/readings", response_model=list[SensorReadingRead])
def list_readings(sensor_id: int, db: Session = Depends(get_db)):
    return (
        db.query(SensorReading)
        .filter(SensorReading.sensor_id == sensor_id)
        .order_by(SensorReading.recorded_at.desc())
        .all()
    )


@router.get("/{sensor_id}/readings/daily", response_model=list[SensorDailyAggregate])
def daily_readings(sensor_id: int, db: Session = Depends(get_db)):
    day_col = func.date(SensorReading.recorded_at)
    rows = (
        db.query(
            day_col.label("day"),
            func.avg(SensorReading.value).label("avg_value"),
            func.min(SensorReading.value).label("min_value"),
            func.max(SensorReading.value).label("max_value"),
            func.count(SensorReading.id).label("count"),
        )
        .filter(SensorReading.sensor_id == sensor_id)
        .group_by(day_col)
        .order_by(day_col.desc())
        .all()
    )
    return [
        SensorDailyAggregate(
            day=row.day, avg_value=round(row.avg_value, 2), min_value=row.min_value,
            max_value=row.max_value, count=row.count,
        )
        for row in rows
    ]


@router.get("/alerts/mine", response_model=list[SensorAlertRead])
def my_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(SensorAlert)
        .join(Sensor, SensorAlert.sensor_id == Sensor.id)
        .join(Farm, Sensor.farm_id == Farm.id)
        .filter(Farm.owner_id == current_user.id)
        .order_by(SensorAlert.created_at.desc())
        .all()
    )


@router.patch("/alerts/{alert_id}/acknowledge", response_model=SensorAlertRead)
def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = (
        db.query(SensorAlert)
        .join(Sensor, SensorAlert.sensor_id == Sensor.id)
        .join(Farm, Sensor.farm_id == Farm.id)
        .filter(SensorAlert.id == alert_id, Farm.owner_id == current_user.id)
        .first()
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.acknowledged = True
    db.commit()
    db.refresh(alert)
    return alert
