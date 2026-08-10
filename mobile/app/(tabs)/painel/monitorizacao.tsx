import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../context/AuthContext'
import {
  acknowledgeAlert,
  fetchMyAlerts,
  fetchMyFarms,
  fetchSensorDailyReadings,
  fetchSensorReadings,
  fetchSensors,
  type Sensor,
  type SensorAlert,
  type SensorDailyAggregate,
  type SensorReading,
} from '../../../lib/api'
import { getSensorStatus, SENSOR_ICONS, SENSOR_UNITS, type SensorStatus } from '../../../lib/sensorStatus'
import LineChart from '../../../components/LineChart'
import { colors } from '../../../theme/colors'

type SensorPanel = {
  sensor: Sensor
  latest: SensorReading | null
  daily: SensorDailyAggregate[]
}

const STATUS_COLOR: Record<SensorStatus, string> = {
  normal: colors.leaf600,
  warning: colors.earth500,
  critical: '#c1462b',
}

export default function Monitorizacao() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [panels, setPanels] = useState<SensorPanel[]>([])
  const [alerts, setAlerts] = useState<SensorAlert[]>([])
  const [hasFarm, setHasFarm] = useState(true)
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  useFocusEffect(
    useCallback(() => {
      if (!token) return
      let cancelled = false

      async function load() {
        const [farms, allSensors, myAlerts] = await Promise.all([
          fetchMyFarms(token!),
          fetchSensors(),
          fetchMyAlerts(token!),
        ])
        if (cancelled) return

        const farm = farms[0]
        if (!farm) {
          setHasFarm(false)
          setStatus('ready')
          return
        }
        setHasFarm(true)

        const mySensors = allSensors.filter((s) => s.farm_id === farm.id)
        const loaded = await Promise.all(
          mySensors.map(async (sensor) => {
            const [readings, daily] = await Promise.all([
              fetchSensorReadings(sensor.id),
              fetchSensorDailyReadings(sensor.id),
            ])
            return { sensor, latest: readings[0] ?? null, daily: [...daily].reverse() }
          }),
        )

        if (cancelled) return
        setPanels(loaded)
        setAlerts(myAlerts)
        setStatus('ready')
      }

      load()
      return () => {
        cancelled = true
      }
    }, [token]),
  )

  async function handleAcknowledge(alertId: number) {
    if (!token) return
    await acknowledgeAlert(alertId, token)
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)))
  }

  if (status === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.leaf700} />
      </View>
    )
  }

  if (!hasFarm) {
    return (
      <View style={styles.emptyScreen}>
        <MaterialCommunityIcons name="sprout-outline" size={40} color={colors.leaf400} />
        <Text style={styles.emptyTitle}>{t('monitoring.noFarmTitle')}</Text>
        <Text style={styles.emptySubtitle}>{t('monitoring.noFarmSubtitle')}</Text>
      </View>
    )
  }

  const unacknowledged = alerts.filter((a) => !a.acknowledged)

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {unacknowledged.length > 0 && (
        <View style={styles.alertsSection}>
          {unacknowledged.map((alert) => (
            <View key={alert.id} style={styles.alertCard}>
              <MaterialCommunityIcons name="alert-circle" size={22} color="#c1462b" />
              <Text style={styles.alertText}>{alert.message}</Text>
              <Pressable style={styles.alertButton} onPress={() => handleAcknowledge(alert.id)}>
                <Text style={styles.alertButtonText}>{t('monitoring.acknowledge')}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {panels.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>{t('monitoring.noSensorsYet')}</Text>
        </View>
      ) : (
        panels.map(({ sensor, latest, daily }) => {
          const sensorStatus = latest ? getSensorStatus(sensor.type, latest.value) : null
          const unit = SENSOR_UNITS[sensor.type]

          return (
            <View key={sensor.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.iconCircle}>
                    <MaterialCommunityIcons
                      name={SENSOR_ICONS[sensor.type] as never}
                      size={22}
                      color={colors.leaf700}
                    />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>
                      {sensor.label || t(`monitoring.type.${sensor.type}`)}
                    </Text>
                    <Text style={styles.cardSubtitle}>{t(`monitoring.type.${sensor.type}`)}</Text>
                  </View>
                </View>

                {sensorStatus && (
                  <View
                    style={[styles.statusBadge, { backgroundColor: `${STATUS_COLOR[sensorStatus]}1A` }]}
                  >
                    <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[sensorStatus] }]} />
                    <Text style={[styles.statusText, { color: STATUS_COLOR[sensorStatus] }]}>
                      {t(`monitoring.status.${sensorStatus}`)}
                    </Text>
                  </View>
                )}
              </View>

              {latest ? (
                <Text style={styles.latestValue}>
                  {latest.value.toLocaleString('pt-AO')}
                  <Text style={styles.latestUnit}> {unit}</Text>
                </Text>
              ) : (
                <Text style={styles.noReadings}>{t('monitoring.noReadings')}</Text>
              )}

              {daily.length > 1 && (
                <View style={styles.chartWrap}>
                  <Text style={styles.chartLabel}>{t('monitoring.historyLabel')}</Text>
                  <LineChart
                    data={daily.map((d) => ({
                      label: d.day.slice(5),
                      value: d.avg_value,
                    }))}
                    color={STATUS_COLOR[sensorStatus ?? 'normal']}
                    unit={unit}
                  />
                </View>
              )}
            </View>
          )
        })
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
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 14,
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
  emptyBox: {
    borderRadius: 16,
    backgroundColor: colors.leaf50,
    padding: 28,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 13,
    color: 'rgba(15,36,17,0.6)',
  },
  alertsSection: {
    gap: 10,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f0c9bd',
    backgroundColor: '#fdf1ed',
    padding: 14,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#8a3018',
  },
  alertButton: {
    borderRadius: 999,
    backgroundColor: '#c1462b',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  alertButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.leaf100,
    backgroundColor: '#fff',
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  iconCircle: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: colors.leaf50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.leaf950,
  },
  cardSubtitle: {
    fontSize: 12,
    color: 'rgba(15,36,17,0.55)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusDot: {
    height: 6,
    width: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  latestValue: {
    marginTop: 14,
    fontSize: 32,
    fontWeight: '700',
    color: colors.leaf950,
  },
  latestUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(15,36,17,0.5)',
  },
  noReadings: {
    marginTop: 14,
    fontSize: 13,
    color: 'rgba(15,36,17,0.5)',
  },
  chartWrap: {
    marginTop: 16,
  },
  chartLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(15,36,17,0.6)',
    marginBottom: 6,
  },
})
