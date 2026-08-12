"""Rule-based farming recommendations derived from satellite soil indices.

Only decides *what* to recommend (category + level) — the farmer-facing
text lives in the frontend's i18n files, same as every other translated
string in the app. This keeps the recommendation copy in sync across
pt/en/fr/zh instead of baking one language into the API response.
"""

from app.schemas.soil import SoilRecommendation

_SALINITY_RISK_THRESHOLD = 0.3
_BARE_SOIL_THRESHOLD = 0.05
_VEGETATED_THRESHOLD = 0.4


def _classify_irrigation(ndmi_mean: float | None) -> str:
    if ndmi_mean is None:
        return "unknown"
    if ndmi_mean < 0:
        return "critical"
    if ndmi_mean < 0.2:
        return "attention"
    return "good"


def _classify_planting(
    ndvi_mean: float | None,
    ndmi_mean: float | None,
    salinity_index_mean: float | None,
) -> str:
    if ndvi_mean is not None and ndvi_mean >= _VEGETATED_THRESHOLD:
        return "occupied"
    if salinity_index_mean is not None and salinity_index_mean >= _SALINITY_RISK_THRESHOLD:
        return "unfavorable"
    if ndmi_mean is not None and ndmi_mean < 0:
        return "wait_moisture"
    return "favorable"


def generate_recommendations(
    ndmi_mean: float | None,
    ndti_mean: float | None,
    salinity_index_mean: float | None,
    ndvi_mean: float | None,
) -> list[SoilRecommendation]:
    recommendations = [
        SoilRecommendation(category="irrigation", level=_classify_irrigation(ndmi_mean)),
        SoilRecommendation(
            category="planting",
            level=_classify_planting(ndvi_mean, ndmi_mean, salinity_index_mean),
        ),
    ]

    if salinity_index_mean is not None and salinity_index_mean >= _SALINITY_RISK_THRESHOLD:
        recommendations.append(SoilRecommendation(category="soil_treatment", level="salinity"))

    if ndti_mean is not None and ndti_mean < _BARE_SOIL_THRESHOLD:
        recommendations.append(SoilRecommendation(category="soil_treatment", level="residue"))

    return recommendations
