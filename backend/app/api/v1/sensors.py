from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.sensor import Sensor, SensorReading
from app.schemas.sensor import (
    SensorCreate,
    SensorRead,
    SensorReadingCreate,
    SensorReadingRead,
)

router = APIRouter(prefix="/sensors", tags=["sensors"])


@router.post("/", response_model=SensorRead)
def create_sensor(payload: SensorCreate, db: Session = Depends(get_db)):
    sensor = Sensor(**payload.model_dump())
    db.add(sensor)
    db.commit()
    db.refresh(sensor)
    return sensor


@router.get("/", response_model=list[SensorRead])
def list_sensors(db: Session = Depends(get_db)):
    return db.query(Sensor).all()


@router.post("/readings", response_model=SensorReadingRead)
def ingest_reading(payload: SensorReadingCreate, db: Session = Depends(get_db)):
    sensor = db.query(Sensor).get(payload.sensor_id)
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")

    reading = SensorReading(sensor_id=payload.sensor_id, value=payload.value)
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading


@router.get("/{sensor_id}/readings", response_model=list[SensorReadingRead])
def list_readings(sensor_id: int, db: Session = Depends(get_db)):
    return (
        db.query(SensorReading)
        .filter(SensorReading.sensor_id == sensor_id)
        .order_by(SensorReading.recorded_at.desc())
        .all()
    )
