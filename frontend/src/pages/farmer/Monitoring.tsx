import { useEffect, useState } from 'react'
import { AlertCircle, Droplets, Sprout, Thermometer, Waves } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
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
  type SensorType,
} from '../../api/client'
import { getSensorStatus, useSensorLabels, SENSOR_UNITS, type SensorStatus } from '../../utils/sensorStatus'
import LineChart from '../../components/LineChart'

type SensorPanel = {
  sensor: Sensor
  latest: SensorReading | null
  daily: SensorDailyAggregate[]
}

const STATUS_COLOR: Record<SensorStatus, string> = {
  normal: '#2b632a',
  warning: '#a56b2f',
  critical: '#c1462b',
}

const SENSOR_ICONS: Record<SensorType, typeof Sprout> = {
  soil_moisture: Droplets,
  temperature: Thermometer,
  humidity: Waves,
  water_level: Waves,
}

export default function Monitoring() {
  const { t } = useTranslation()
  const SENSOR_LABELS = useSensorLabels()
  const { token } = useAuth()
  const [panels, setPanels] = useState<SensorPanel[]>([])
  const [alerts, setAlerts] = useState<SensorAlert[]>([])
  const [hasFarm, setHasFarm] = useState(true)
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  useEffect(() => {
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
  }, [token])

  async function handleAcknowledge(alertId: number) {
    if (!token) return
    await acknowledgeAlert(alertId, token)
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)))
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

  if (!hasFarm) {
    return (
      <div className="rounded-2xl border border-earth-200 bg-earth-50 p-6 text-center text-earth-800">
        <Sprout className="mx-auto mb-2" size={32} />
        <p className="font-medium">{t('farmerMonitoring.noFarmTitle')}</p>
        <p className="mt-1 text-sm">{t('farmerMonitoring.noFarmSubtitle')}</p>
      </div>
    )
  }

  const unacknowledged = alerts.filter((a) => !a.acknowledged)

  return (
    <div className="space-y-4">
      {unacknowledged.length > 0 && (
        <div className="space-y-2.5">
          {unacknowledged.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center gap-3 rounded-2xl border border-[#f0c9bd] bg-[#fdf1ed] p-4"
            >
              <AlertCircle size={20} className="shrink-0 text-[#c1462b]" />
              <p className="flex-1 text-sm font-semibold text-[#8a3018]">{alert.message}</p>
              <button
                onClick={() => handleAcknowledge(alert.id)}
                className="shrink-0 rounded-full bg-[#c1462b] px-3 py-2 text-xs font-bold text-white hover:opacity-90"
              >
                {t('farmerMonitoring.acknowledge')}
              </button>
            </div>
          ))}
        </div>
      )}

      {panels.length === 0 ? (
        <div className="rounded-2xl bg-leaf-50 p-8 text-center text-sm text-leaf-950/60">
          {t('farmerMonitoring.noSensors')}
        </div>
      ) : (
        panels.map(({ sensor, latest, daily }) => {
          const sensorStatus = latest ? getSensorStatus(sensor.type, latest.value) : null
          const unit = SENSOR_UNITS[sensor.type]
          const Icon = SENSOR_ICONS[sensor.type]

          return (
            <div key={sensor.id} className="rounded-2xl border border-leaf-100 bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-leaf-50">
                    <Icon size={20} className="text-leaf-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-leaf-950">
                      {sensor.label || SENSOR_LABELS[sensor.type]}
                    </p>
                    <p className="text-xs text-leaf-950/55">{SENSOR_LABELS[sensor.type]}</p>
                  </div>
                </div>

                {sensorStatus && (
                  <span
                    className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
                    style={{ backgroundColor: `${STATUS_COLOR[sensorStatus]}1A`, color: STATUS_COLOR[sensorStatus] }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLOR[sensorStatus] }}
                    />
                    {sensorStatus === 'normal'
                      ? t('farmerMonitoring.statusNormal')
                      : sensorStatus === 'warning'
                        ? t('farmerMonitoring.statusWarning')
                        : t('farmerMonitoring.statusCritical')}
                  </span>
                )}
              </div>

              {latest ? (
                <p className="mt-3.5 text-3xl font-bold text-leaf-950">
                  {latest.value.toLocaleString('pt-AO')}
                  <span className="ml-1 text-base font-medium text-leaf-950/50">{unit}</span>
                </p>
              ) : (
                <p className="mt-3.5 text-sm text-leaf-950/50">{t('farmerMonitoring.noReadingsYet')}</p>
              )}

              {daily.length > 1 && (
                <div className="mt-4">
                  <p className="mb-1.5 text-xs font-semibold text-leaf-950/60">{t('farmerMonitoring.lastDays')}</p>
                  <LineChart
                    data={daily.map((d) => ({ label: d.day.slice(5), value: d.avg_value }))}
                    color={STATUS_COLOR[sensorStatus ?? 'normal']}
                    unit={unit}
                  />
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
