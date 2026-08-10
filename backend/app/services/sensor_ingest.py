from sqlalchemy.orm import Session

from app.models.sensor import AlertSeverity, Sensor, SensorAlert, SensorReading, SensorType

# Starting-point agronomic thresholds, not scientifically calibrated —
# good enough to prove the alert pipeline works, refine once real
# readings/agronomist input are available.
CRITICAL_THRESHOLDS = {
    SensorType.SOIL_MOISTURE: {"min": 20.0, "message": "Humidade do solo muito baixa ({value}%)"},
    SensorType.TEMPERATURE: {
        "min": 5.0,
        "max": 38.0,
        "message": "Temperatura fora do intervalo seguro ({value}°C)",
    },
    SensorType.HUMIDITY: {"min": 30.0, "message": "Humidade do ar muito baixa ({value}%)"},
    SensorType.WATER_LEVEL: {"min": 10.0, "message": "Nível de água muito baixo ({value})"},
}


def authenticate_device(db: Session, *, sensor_id: int, device_key: str) -> Sensor | None:
    """Look up a sensor by id+device_key. Returns None for an unknown
    sensor_id or a wrong key — callers must silently drop the reading
    rather than reveal which one was wrong."""
    return (
        db.query(Sensor)
        .filter(Sensor.id == sensor_id, Sensor.device_key == device_key)
        .first()
    )


def record_reading(db: Session, *, sensor: Sensor, value: float) -> SensorReading:
    """Persist a sensor reading and raise a sensor_alerts row if it crosses
    the critical threshold for that sensor type. Shared by the REST
    ingest endpoint and the MQTT listener so alerting logic isn't
    duplicated between the two ingestion paths."""
    reading = SensorReading(sensor_id=sensor.id, value=value)
    db.add(reading)
    db.flush()

    threshold = CRITICAL_THRESHOLDS.get(sensor.type)
    if threshold:
        breached = ("min" in threshold and value < threshold["min"]) or (
            "max" in threshold and value > threshold["max"]
        )
        if breached:
            db.add(
                SensorAlert(
                    sensor_id=sensor.id,
                    reading_id=reading.id,
                    severity=AlertSeverity.CRITICAL,
                    message=threshold["message"].format(value=value),
                )
            )

    db.commit()
    db.refresh(reading)
    return reading
