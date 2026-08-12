import { useCallback, useEffect, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../context/AuthContext'
import {
  ApiError,
  analyzeSoil,
  fetchLatestSoilObservation,
  fetchMyFarms,
  updateFarm,
  type Farm,
  type SoilObservation,
  type SoilPolygon,
} from '../../../lib/api'
import PolygonMapDraw from '../../../components/PolygonMapDraw'
import { colors } from '../../../theme/colors'

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

const BAND_COLOR: Record<string, string> = {
  dry: '#c1462b',
  low: colors.earth600,
  bare: colors.earth600,
  moderate: colors.earth600,
  partial: colors.earth600,
  high: colors.leaf700,
}

const RECOMMENDATION_ICON: Record<string, string> = {
  irrigation: 'water-outline',
  planting: 'sprout',
  soil_treatment: 'flask-outline',
}

const RECOMMENDATION_I18N_KEY: Record<string, string> = {
  irrigation: 'irrigation',
  planting: 'planting',
  soil_treatment: 'soilTreatment',
}

const CRITICAL_LEVELS = new Set(['critical', 'unfavorable', 'salinity'])
const ATTENTION_LEVELS = new Set(['attention', 'wait_moisture', 'residue'])
const GOOD_LEVELS = new Set(['good', 'favorable'])

function recommendationSeverity(level: string): 'critical' | 'attention' | 'good' | 'neutral' {
  if (CRITICAL_LEVELS.has(level)) return 'critical'
  if (ATTENTION_LEVELS.has(level)) return 'attention'
  if (GOOD_LEVELS.has(level)) return 'good'
  return 'neutral'
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#c1462b',
  attention: colors.earth600,
  good: colors.leaf700,
  neutral: 'rgba(15,36,17,0.6)',
}

export default function Soil() {
  const { t } = useTranslation()
  const { token } = useAuth()

  const [farm, setFarm] = useState<Farm | null>(null)
  const [farmLoaded, setFarmLoaded] = useState(false)

  const [draftPolygon, setDraftPolygon] = useState<SoilPolygon | null>(null)
  const [savingPolygon, setSavingPolygon] = useState(false)
  const [polygonError, setPolygonError] = useState<string | null>(null)
  const [polygonSaved, setPolygonSaved] = useState(false)

  const [observation, setObservation] = useState<SoilObservation | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  const [gpsCenter, setGpsCenter] = useState<[number, number] | null>(null)
  const [locationSettled, setLocationSettled] = useState(false)

  const status: 'loading' | 'ready' = farmLoaded && locationSettled ? 'ready' : 'loading'

  useEffect(() => {
    let cancelled = false

    async function locate() {
      try {
        const { status: permission } = await Location.requestForegroundPermissionsAsync()
        if (permission !== 'granted' || cancelled) return

        const position = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000)),
        ])
        if (position && !cancelled) {
          setGpsCenter([position.coords.latitude, position.coords.longitude])
        }
      } catch {
        // keep gpsCenter null — the screen falls back to the farm's stored coordinates
      } finally {
        if (!cancelled) setLocationSettled(true)
      }
    }

    locate()
    return () => {
      cancelled = true
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      if (!token) return
      let cancelled = false

      fetchMyFarms(token).then(async (farms) => {
        if (cancelled) return
        const first = farms[0] ?? null
        setFarm(first)
        if (first) {
          try {
            const latest = await fetchLatestSoilObservation(first.id, token)
            if (!cancelled) setObservation(latest)
          } catch {
            if (!cancelled) setObservation(null)
          }
        }
        if (!cancelled) setFarmLoaded(true)
      })

      return () => {
        cancelled = true
      }
    }, [token]),
  )

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
      setObservation(await analyzeSoil(farm.id, null, token))
    } catch (err) {
      setAnalyzeError(err instanceof ApiError ? err.message : t('soil.analyzeError'))
    } finally {
      setAnalyzing(false)
    }
  }

  if (status === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.leaf700} />
      </View>
    )
  }

  if (!farm) {
    return (
      <View style={styles.emptyScreen}>
        <MaterialCommunityIcons name="satellite-variant" size={40} color={colors.leaf400} />
        <Text style={styles.emptyTitle}>{t('soil.noFarmTitle')}</Text>
        <Text style={styles.emptySubtitle}>{t('soil.noFarmSubtitle')}</Text>
      </View>
    )
  }

  const savedPolygon: SoilPolygon | null = farm.boundary_geojson
    ? JSON.parse(farm.boundary_geojson)
    : null
  const center: [number, number] | undefined =
    gpsCenter ??
    (farm.latitude != null && farm.longitude != null ? [farm.latitude, farm.longitude] : undefined)

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View>
        <Text style={styles.sectionTitle}>{t('soil.drawTitle')}</Text>
        <Text style={styles.sectionSubtitle}>{t('soil.drawSubtitle')}</Text>

        <View style={styles.mapWrap}>
          <PolygonMapDraw
            initialGeoJSON={savedPolygon}
            center={center}
            onChange={(polygon) => {
              setDraftPolygon(polygon)
              setPolygonSaved(false)
            }}
          />
        </View>

        {polygonError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{polygonError}</Text>
          </View>
        )}
        {polygonSaved && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{t('soil.polygonSaved')}</Text>
          </View>
        )}

        <Pressable
          style={[styles.button, (!draftPolygon || savingPolygon) && styles.buttonDisabled]}
          onPress={handleSavePolygon}
          disabled={!draftPolygon || savingPolygon}
        >
          <Text style={styles.buttonText}>
            {savingPolygon ? t('soil.saving') : t('soil.savePolygon')}
          </Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('soil.analysisTitle')}</Text>

        {!farm.boundary_geojson ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{t('soil.noPolygonYet')}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionSubtitle}>{t('soil.analyzeHint')}</Text>

            {analyzeError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{analyzeError}</Text>
              </View>
            )}

            <Pressable
              style={[styles.button, styles.buttonRow, analyzing && styles.buttonDisabled]}
              onPress={handleAnalyze}
              disabled={analyzing}
            >
              <MaterialCommunityIcons name="satellite-variant" size={16} color="#fff" />
              <Text style={styles.buttonText}>
                {analyzing ? t('soil.analyzing') : t('soil.analyzeButton')}
              </Text>
            </Pressable>
          </>
        )}
      </View>

      {observation ? (
        <View style={styles.section}>
          <View style={styles.resultHeader}>
            <Text style={styles.sectionTitle}>{t('soil.lastAnalysis')}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>
                  {t('soil.sceneDate')}: {observation.acquisition_date}
                </Text>
              </View>
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>
                  {t('soil.cloudCover')}: {observation.cloud_cover_pct.toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.cardsGrid}>
            {observation.ndmi_mean !== null && (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <MaterialCommunityIcons name="water-outline" size={18} color={colors.leaf700} />
                  <Text style={styles.cardTitle}>{t('soil.moisture.title')}</Text>
                </View>
                <Text style={styles.cardValue}>{observation.ndmi_mean.toFixed(2)}</Text>
                <Text
                  style={[
                    styles.cardHint,
                    { color: BAND_COLOR[classifyMoisture(observation.ndmi_mean)] },
                  ]}
                >
                  {t(`soil.moisture.${classifyMoisture(observation.ndmi_mean)}`)}
                </Text>
              </View>
            )}

            {observation.lst_celsius_mean !== null && (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <MaterialCommunityIcons name="thermometer" size={18} color={colors.leaf700} />
                  <Text style={styles.cardTitle}>{t('soil.temperature.title')}</Text>
                </View>
                <Text style={styles.cardValue}>{observation.lst_celsius_mean.toFixed(1)}°C</Text>
                <Text style={styles.cardHint}>{t('soil.temperature.hint')}</Text>
              </View>
            )}

            {observation.ndti_mean !== null && (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <MaterialCommunityIcons name="grass" size={18} color={colors.leaf700} />
                  <Text style={styles.cardTitle}>{t('soil.residue.title')}</Text>
                </View>
                <Text style={styles.cardValue}>{observation.ndti_mean.toFixed(2)}</Text>
                <Text
                  style={[
                    styles.cardHint,
                    { color: BAND_COLOR[classifyResidue(observation.ndti_mean)] },
                  ]}
                >
                  {t(`soil.residue.${classifyResidue(observation.ndti_mean)}`)}
                </Text>
              </View>
            )}

            {observation.salinity_index_mean !== null && (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <MaterialCommunityIcons name="flask-outline" size={18} color={colors.leaf700} />
                  <Text style={styles.cardTitle}>{t('soil.salinity.title')}</Text>
                </View>
                <Text style={styles.cardValue}>{observation.salinity_index_mean.toFixed(2)}</Text>
                <Text
                  style={[
                    styles.cardHint,
                    { color: BAND_COLOR[classifySalinity(observation.salinity_index_mean)] },
                  ]}
                >
                  {t(`soil.salinity.${classifySalinity(observation.salinity_index_mean)}`)}
                </Text>
              </View>
            )}
          </View>

          {observation.recommendations.length > 0 && (
            <View style={styles.recommendationsSection}>
              <Text style={styles.sectionTitle}>{t('soil.recommendations.title')}</Text>
              <View style={styles.recommendationsList}>
                {observation.recommendations.map((rec) => {
                  const key = RECOMMENDATION_I18N_KEY[rec.category]
                  const severity = recommendationSeverity(rec.level)
                  return (
                    <View key={`${rec.category}-${rec.level}`} style={styles.recommendationCard}>
                      <MaterialCommunityIcons
                        name={RECOMMENDATION_ICON[rec.category] as never}
                        size={20}
                        color={SEVERITY_COLOR[severity]}
                      />
                      <View style={styles.recommendationText}>
                        <Text style={styles.recommendationLabel}>
                          {t(`soil.recommendations.${key}.label`)}
                        </Text>
                        <Text style={styles.recommendationMessage}>
                          {t(`soil.recommendations.${key}.${rec.level}`)}
                        </Text>
                      </View>
                    </View>
                  )
                })}
              </View>
            </View>
          )}
        </View>
      ) : (
        farm.boundary_geojson && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{t('soil.noObservationYet')}</Text>
          </View>
        )
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream50,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream50,
  },
  emptyScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
    backgroundColor: colors.cream50,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.leaf950,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: 'rgba(15,36,17,0.6)',
    textAlign: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.leaf950,
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(15,36,17,0.6)',
  },
  mapWrap: {
    marginTop: 14,
  },
  errorBox: {
    marginTop: 14,
    borderRadius: 10,
    backgroundColor: colors.earth50,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 13,
    color: colors.earth800,
  },
  successBox: {
    marginTop: 14,
    borderRadius: 10,
    backgroundColor: colors.leaf100,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  successText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.leaf800,
  },
  button: {
    marginTop: 16,
    borderRadius: 999,
    backgroundColor: colors.leaf700,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyBox: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: colors.leaf50,
    padding: 28,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 13,
    color: 'rgba(15,36,17,0.6)',
  },
  resultHeader: {
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    borderRadius: 999,
    backgroundColor: colors.leaf100,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  metaChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.leaf700,
  },
  cardsGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.leaf100,
    backgroundColor: '#fff',
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.leaf950,
  },
  cardValue: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: '700',
    color: colors.leaf950,
  },
  cardHint: {
    marginTop: 4,
    fontSize: 12,
    color: 'rgba(15,36,17,0.65)',
  },
  recommendationsSection: {
    marginTop: 20,
  },
  recommendationsList: {
    marginTop: 12,
    gap: 10,
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.leaf100,
    backgroundColor: '#fff',
    padding: 14,
  },
  recommendationText: {
    flex: 1,
  },
  recommendationLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.leaf950,
  },
  recommendationMessage: {
    marginTop: 2,
    fontSize: 13,
    color: 'rgba(15,36,17,0.7)',
  },
})
