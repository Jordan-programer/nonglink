import json

from fastapi import APIRouter, Depends, HTTPException
from shapely.geometry import shape
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.farm import Farm
from app.models.soil import SoilObservation
from app.models.user import User
from app.schemas.soil import SoilAnalyzeRequest, SoilObservationRead
from app.services.earth_engine import (
    EarthEngineNotConfiguredError,
    SoilDataUnavailableError,
    analyze_soil,
)
from app.services.soil_recommendations import generate_recommendations

router = APIRouter(prefix="/soil", tags=["soil"])


def _get_owned_farm(db: Session, farm_id: int, current_user: User) -> Farm:
    farm = db.query(Farm).get(farm_id)
    if not farm or farm.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Farm not found")
    return farm


def _to_read(observation: SoilObservation) -> SoilObservationRead:
    result = SoilObservationRead.model_validate(observation)
    result.recommendations = generate_recommendations(
        ndmi_mean=observation.ndmi_mean,
        ndti_mean=observation.ndti_mean,
        salinity_index_mean=observation.salinity_index_mean,
        ndvi_mean=observation.ndvi_mean,
    )
    return result


def _validate_polygon(polygon: dict) -> None:
    try:
        geometry = shape(polygon)
    except (ValueError, TypeError, KeyError) as err:
        raise HTTPException(status_code=400, detail=f"Polígono inválido: {err}") from err

    if geometry.geom_type not in ("Polygon", "MultiPolygon"):
        raise HTTPException(
            status_code=400, detail="O polígono deve ser do tipo Polygon ou MultiPolygon."
        )
    if not geometry.is_valid:
        raise HTTPException(status_code=400, detail="O polígono desenhado é inválido (auto-intersectante).")


@router.post("/{farm_id}/analyze", response_model=SoilObservationRead)
def analyze(
    farm_id: int,
    payload: SoilAnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = _get_owned_farm(db, farm_id, current_user)

    if payload.polygon is not None:
        _validate_polygon(payload.polygon)
        farm.boundary_geojson = json.dumps(payload.polygon)
        db.commit()
        db.refresh(farm)
    elif not farm.boundary_geojson:
        raise HTTPException(
            status_code=400,
            detail="Esta lavra ainda não tem um polígono desenhado. Desenhe-o no mapa primeiro.",
        )

    polygon = json.loads(farm.boundary_geojson)

    try:
        result = analyze_soil(polygon)
    except EarthEngineNotConfiguredError as err:
        raise HTTPException(status_code=503, detail=str(err)) from err
    except SoilDataUnavailableError as err:
        raise HTTPException(status_code=422, detail=str(err)) from err

    observation = SoilObservation(farm_id=farm.id, **result)
    db.add(observation)
    db.commit()
    db.refresh(observation)
    return _to_read(observation)


@router.get("/{farm_id}/latest", response_model=SoilObservationRead)
def latest(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_owned_farm(db, farm_id, current_user)

    observation = (
        db.query(SoilObservation)
        .filter(SoilObservation.farm_id == farm_id)
        .order_by(SoilObservation.acquisition_date.desc(), SoilObservation.created_at.desc())
        .first()
    )
    if not observation:
        raise HTTPException(status_code=404, detail="Sem análises de solo para esta lavra ainda.")
    return _to_read(observation)


@router.get("/{farm_id}/history", response_model=list[SoilObservationRead])
def history(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_owned_farm(db, farm_id, current_user)

    observations = (
        db.query(SoilObservation)
        .filter(SoilObservation.farm_id == farm_id)
        .order_by(SoilObservation.acquisition_date.desc(), SoilObservation.created_at.desc())
        .limit(12)
        .all()
    )
    return [_to_read(o) for o in observations]
