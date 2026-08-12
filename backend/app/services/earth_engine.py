"""Remote soil diagnostics via Google Earth Engine.

No physical sensors involved: the farmer draws a polygon on the map, and
this module derives soil/vegetation indices from the most recent
cloud-free Landsat 8/9 Collection 2 Level-2 scene covering that polygon.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any

import ee
from google.oauth2 import service_account

from app.core.config import settings

_EE_INITIALIZED = False

# Official USGS Collection 2 Level-2 scale/offset factors.
_SR_SCALE = 0.0000275
_SR_OFFSET = -0.2
_ST_SCALE = 0.00341802
_ST_OFFSET = 149.0

_OPTICAL_BANDS = ["SR_B1", "SR_B2", "SR_B3", "SR_B4", "SR_B5", "SR_B6", "SR_B7"]
_THERMAL_BANDS = ["ST_B10"]

_CLOUD_COVER_MAX = 10
_SEARCH_WINDOW_DAYS = 30
_REDUCE_SCALE_METERS = 30

_INDEX_BANDS = ["NDMI", "LST", "NDTI", "SI", "NDVI"]


class SoilDataUnavailableError(Exception):
    """No cloud-free imagery available over this polygon in the search window."""


class EarthEngineNotConfiguredError(Exception):
    """EE_PRIVATE_KEY_PATH is missing or invalid — service account not set up."""


def _init_earth_engine() -> None:
    global _EE_INITIALIZED
    if _EE_INITIALIZED:
        return

    if not settings.EE_PRIVATE_KEY_PATH or not settings.EE_SERVICE_ACCOUNT_EMAIL:
        raise EarthEngineNotConfiguredError(
            "Earth Engine não está configurado (EE_SERVICE_ACCOUNT_EMAIL / "
            "EE_PRIVATE_KEY_PATH em falta no .env)."
        )

    try:
        credentials = service_account.Credentials.from_service_account_file(
            settings.EE_PRIVATE_KEY_PATH,
            scopes=["https://www.googleapis.com/auth/earthengine"],
        )
    except (FileNotFoundError, ValueError) as err:
        raise EarthEngineNotConfiguredError(
            f"Não foi possível carregar as credenciais do Earth Engine: {err}"
        ) from err

    ee.Initialize(
        credentials=credentials,
        project=settings.EE_GCP_PROJECT_ID or None,
        opt_url="https://earthengine-highvolume.googleapis.com",
    )
    _EE_INITIALIZED = True


def _mask_clouds(image: ee.Image) -> ee.Image:
    qa = image.select("QA_PIXEL")
    dilated_cloud = 1 << 1
    cirrus = 1 << 2
    cloud = 1 << 3
    cloud_shadow = 1 << 4

    mask = (
        qa.bitwiseAnd(dilated_cloud).eq(0)
        .And(qa.bitwiseAnd(cirrus).eq(0))
        .And(qa.bitwiseAnd(cloud).eq(0))
        .And(qa.bitwiseAnd(cloud_shadow).eq(0))
    )
    return image.updateMask(mask)


def _apply_scale_factors(image: ee.Image) -> ee.Image:
    optical = image.select(_OPTICAL_BANDS).multiply(_SR_SCALE).add(_SR_OFFSET)
    thermal = image.select(_THERMAL_BANDS).multiply(_ST_SCALE).add(_ST_OFFSET)
    return image.addBands(optical, None, True).addBands(thermal, None, True)


def _compute_indices(image: ee.Image) -> ee.Image:
    ndmi = image.normalizedDifference(["SR_B5", "SR_B6"]).rename("NDMI")
    ndti = image.normalizedDifference(["SR_B6", "SR_B7"]).rename("NDTI")
    ndvi = image.normalizedDifference(["SR_B5", "SR_B4"]).rename("NDVI")
    lst_celsius = image.select("ST_B10").subtract(273.15).rename("LST")
    salinity_index = (
        image.select("SR_B3").multiply(image.select("SR_B4")).sqrt().rename("SI")
    )
    return image.addBands([ndmi, ndti, ndvi, lst_celsius, salinity_index])


def _load_landsat_collection(
    geometry: ee.Geometry, start_date: date, end_date: date
) -> ee.ImageCollection:
    filters = ee.Filter.And(
        ee.Filter.bounds(geometry),
        ee.Filter.date(str(start_date), str(end_date)),
        ee.Filter.lt("CLOUD_COVER", _CLOUD_COVER_MAX),
    )
    l9 = ee.ImageCollection("LANDSAT/LC09/C02/T1_L2").filter(filters)
    l8 = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2").filter(filters)
    return l9.merge(l8).sort("system:time_start", False)


def analyze_soil(
    geojson_polygon: dict[str, Any],
    reference_date: date | None = None,
) -> dict[str, Any]:
    """Computes NDMI, LST, NDTI, SI and NDVI over a polygon using the most
    recent cloud-free (<10%) Landsat 8/9 scene from the last 30 days.

    Returns a dict shaped to map 1:1 onto SoilObservation columns. Raises
    SoilDataUnavailableError if no usable imagery is found.
    """
    _init_earth_engine()

    reference_date = reference_date or date.today()
    start_date = reference_date - timedelta(days=_SEARCH_WINDOW_DAYS)

    geometry = ee.Geometry(geojson_polygon)
    collection = _load_landsat_collection(geometry, start_date, reference_date)

    if collection.size().getInfo() == 0:
        raise SoilDataUnavailableError(
            f"Sem imagens Landsat 8/9 com menos de {_CLOUD_COVER_MAX}% de nuvens "
            f"nos últimos {_SEARCH_WINDOW_DAYS} dias para este talhão."
        )

    processed = (
        collection.map(_mask_clouds).map(_apply_scale_factors).map(_compute_indices)
    )

    latest_scene = processed.first()
    scene_id = latest_scene.get("system:index").getInfo()
    scene_date = ee.Date(latest_scene.get("system:time_start")).format("YYYY-MM-dd").getInfo()
    cloud_cover = latest_scene.get("CLOUD_COVER").getInfo()

    reducer = ee.Reducer.mean().combine(ee.Reducer.minMax(), sharedInputs=True)
    stats = latest_scene.select(_INDEX_BANDS).reduceRegion(
        reducer=reducer,
        geometry=geometry,
        scale=_REDUCE_SCALE_METERS,
        maxPixels=1e9,
        bestEffort=True,
    ).getInfo()

    if stats.get("NDMI_mean") is None:
        raise SoilDataUnavailableError(
            "A cena mais recente ficou totalmente coberta por nuvens sobre este talhão."
        )

    return {
        "source": "landsat_9" if "LC09" in scene_id else "landsat_8",
        "acquisition_date": date.fromisoformat(scene_date),
        "cloud_cover_pct": float(cloud_cover),
        "ndmi_mean": stats.get("NDMI_mean"),
        "ndmi_min": stats.get("NDMI_min"),
        "ndmi_max": stats.get("NDMI_max"),
        "lst_celsius_mean": stats.get("LST_mean"),
        "lst_celsius_min": stats.get("LST_min"),
        "lst_celsius_max": stats.get("LST_max"),
        "ndti_mean": stats.get("NDTI_mean"),
        "ndti_min": stats.get("NDTI_min"),
        "ndti_max": stats.get("NDTI_max"),
        "salinity_index_mean": stats.get("SI_mean"),
        "salinity_index_min": stats.get("SI_min"),
        "salinity_index_max": stats.get("SI_max"),
        "ndvi_mean": stats.get("NDVI_mean"),
        "ndvi_min": stats.get("NDVI_min"),
        "ndvi_max": stats.get("NDVI_max"),
    }
