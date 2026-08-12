import { useEffect, useState } from 'react'
import { Droplets, FlaskConical, Layers, Satellite, Sprout, Thermometer } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import {
  ApiError,
  analyzeSoil,
  fetchLatestSoilObservation,
  fetchMyFarms,
  updateFarm,
  type Farm,
  type SoilObservation,
} from '../../api/client'
import PolygonMapDraw from '../../components/PolygonMapDraw'

type MoistureBand = 'dry' | 'low' | 'moderate' | 'high'
type ResidueBand = 'bare' | 'partial' | 'high'
type SalinityBand = 'low' | 'moderate' | 'high'

function classifyMoisture(value: number): MoistureBand {
  if (value < 0) return 'dry'
  if (value < 0.2) return 'low'
  if (value < 0.4) return 'moderate'
  return 'high'
}

function classifyResidue(value: number): ResidueBand {
  if (value < 0.1) return 'bare'
  if (value < 0.2) return 'partial'
  return 'high'
}

function classifySalinity(value: number): SalinityBand {
  if (value < 0.15) return 'low'
  if (value < 0.3) return 'moderate'
  return 'high'
}

const BAND_STYLE: Record<string, string> = {
  dry: 'bg-[#fdf1ed] border-[#f0c9bd] text-[#8a3018]',
  low: 'bg-earth-50 border-earth-200 text-earth-800',
  bare: 'bg-earth-50 border-earth-200 text-earth-800',
  moderate: 'bg-earth-50 border-earth-200 text-earth-800',
  partial: 'bg-earth-50 border-earth-200 text-earth-800',
  high: 'bg-leaf-50 border-leaf-100 text-leaf-800',
}

export default function Soil() {
  const { t } = useTranslation()
  const { token } = useAuth()

  const [farm, setFarm] = useState<Farm | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  const [draftPolygon, setDraftPolygon] = useState<GeoJSON.Polygon | null>(null)
  const [savingPolygon, setSavingPolygon] = useState(false)
  const [polygonError, setPolygonError] = useState<string | null>(null)
  const [polygonSaved, setPolygonSaved] = useState(false)

  const [observation, setObservation] = useState<SoilObservation | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    fetchMyFarms(token).then(async (farms) => {
      const first = farms[0] ?? null
      setFarm(first)
      if (first) {
        try {
          setObservation(await fetchLatestSoilObservation(first.id, token))
        } catch {
          setObservation(null)
        }
      }
      setStatus('ready')
    })
  }, [token])

  async function handleSavePolygon() {
    if (!farm || !draftPolygon || !token) return
    setSavingPolygon(true)
    setPolygonError(null)
    setPolygonSaved(false)
    try {
      const updated = await updateFarm(
        farm.id,
        { boundary_geojson: JSON.stringify(draftPolygon) },
        token,
      )
      setFarm(updated)
      setPolygonSaved(true)
    } catch (err) {
      setPolygonError(err instanceof ApiError ? err.message : t('soil.saveError'))
    } finally {
      setSavingPolygon(false)
    }
  }

  async function handleAnalyze() {
    if (!farm || !token) return
    setAnalyzing(true)
    setAnalyzeError(null)
    try {
      const result = await analyzeSoil(farm.id, null, token)
      setObservation(result)
    } catch (err) {
      setAnalyzeError(err instanceof ApiError ? err.message : t('soil.analyzeError'))
    } finally {
      setAnalyzing(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-leaf-50" />
        ))}
      </div>
    )
  }

  if (!farm) {
    return (
      <div className="rounded-2xl border border-earth-200 bg-earth-50 p-6 text-earth-800">
        <p className="font-medium">{t('soil.noFarmTitle')}</p>
        <p className="mt-1 text-sm">{t('soil.noFarmSubtitle')}</p>
      </div>
    )
  }

  const savedPolygon: GeoJSON.Polygon | null = farm.boundary_geojson
    ? JSON.parse(farm.boundary_geojson)
    : null
  const center: [number, number] | undefined =
    farm.latitude != null && farm.longitude != null ? [farm.latitude, farm.longitude] : undefined

  return (
    <div className="space-y-8">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-leaf-950">
          <Satellite size={18} className="text-leaf-700" /> {t('soil.drawTitle')}
        </h2>
        <p className="mt-1 text-sm text-leaf-950/60">{t('soil.drawSubtitle')}</p>

        <div className="mt-4">
          <PolygonMapDraw
            initialGeoJSON={savedPolygon}
            center={center}
            onChange={(polygon) => {
              setDraftPolygon(polygon)
              setPolygonSaved(false)
            }}
          />
        </div>

        {polygonError && (
          <p className="mt-3 rounded-lg bg-earth-50 px-3 py-2 text-sm text-earth-800">
            {polygonError}
          </p>
        )}
        {polygonSaved && (
          <p className="mt-3 rounded-lg bg-leaf-100 px-3 py-2 text-sm font-medium text-leaf-800">
            {t('soil.polygonSaved')}
          </p>
        )}

        <button
          onClick={handleSavePolygon}
          disabled={!draftPolygon || savingPolygon}
          className="mt-4 rounded-full bg-leaf-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-leaf-800 disabled:opacity-50"
        >
          {savingPolygon ? t('soil.saving') : t('soil.savePolygon')}
        </button>
      </div>

      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-leaf-950">
          <Layers size={18} className="text-leaf-700" /> {t('soil.analysisTitle')}
        </h2>

        {!farm.boundary_geojson ? (
          <div className="mt-3 rounded-2xl bg-leaf-50 p-6 text-sm text-leaf-950/60">
            {t('soil.noPolygonYet')}
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-leaf-950/60">{t('soil.analyzeHint')}</p>

            {analyzeError && (
              <p className="mt-3 rounded-lg bg-earth-50 px-3 py-2 text-sm text-earth-800">
                {analyzeError}
              </p>
            )}

            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="mt-4 flex items-center gap-2 rounded-full bg-leaf-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-leaf-800 disabled:opacity-60"
            >
              <Satellite size={16} />
              {analyzing ? t('soil.analyzing') : t('soil.analyzeButton')}
            </button>
          </>
        )}
      </div>

      {observation ? (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-leaf-950">{t('soil.lastAnalysis')}</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-leaf-950/60">
              <span className="rounded-full bg-leaf-100 px-2.5 py-1 font-medium text-leaf-700">
                {t('soil.sceneDate')}: {observation.acquisition_date}
              </span>
              <span className="rounded-full bg-leaf-100 px-2.5 py-1 font-medium text-leaf-700">
                {t('soil.cloudCover')}: {observation.cloud_cover_pct.toFixed(1)}%
              </span>
              <span className="rounded-full bg-leaf-100 px-2.5 py-1 font-medium text-leaf-700">
                {observation.source === 'landsat_9' ? 'Landsat 9' : 'Landsat 8'}
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {observation.ndmi_mean !== null && (
              <div
                className={`rounded-2xl border p-4 ${BAND_STYLE[classifyMoisture(observation.ndmi_mean)]}`}
              >
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <Droplets size={16} /> {t('soil.moisture.title')}
                </p>
                <p className="mt-1 text-2xl font-bold">{observation.ndmi_mean.toFixed(2)}</p>
                <p className="mt-1.5 text-sm">
                  {t(`soil.moisture.${classifyMoisture(observation.ndmi_mean)}`)}
                </p>
              </div>
            )}

            {observation.lst_celsius_mean !== null && (
              <div className="rounded-2xl border border-leaf-100 bg-leaf-50 p-4 text-leaf-800">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <Thermometer size={16} /> {t('soil.temperature.title')}
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {observation.lst_celsius_mean.toFixed(1)}°C
                </p>
                <p className="mt-1.5 text-sm">{t('soil.temperature.hint')}</p>
              </div>
            )}

            {observation.ndti_mean !== null && (
              <div
                className={`rounded-2xl border p-4 ${BAND_STYLE[classifyResidue(observation.ndti_mean)]}`}
              >
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <Sprout size={16} /> {t('soil.residue.title')}
                </p>
                <p className="mt-1 text-2xl font-bold">{observation.ndti_mean.toFixed(2)}</p>
                <p className="mt-1.5 text-sm">
                  {t(`soil.residue.${classifyResidue(observation.ndti_mean)}`)}
                </p>
              </div>
            )}

            {observation.salinity_index_mean !== null && (
              <div
                className={`rounded-2xl border p-4 ${BAND_STYLE[classifySalinity(observation.salinity_index_mean)]}`}
              >
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <FlaskConical size={16} /> {t('soil.salinity.title')}
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {observation.salinity_index_mean.toFixed(2)}
                </p>
                <p className="mt-1.5 text-sm">
                  {t(`soil.salinity.${classifySalinity(observation.salinity_index_mean)}`)}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        farm.boundary_geojson && (
          <div className="rounded-2xl border border-leaf-100 bg-leaf-50 p-8 text-center text-sm text-leaf-950/60">
            {t('soil.noObservationYet')}
          </div>
        )
      )}
    </div>
  )
}
