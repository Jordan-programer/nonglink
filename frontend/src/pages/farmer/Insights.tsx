import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CalendarClock, Droplets, Sparkles, Sprout } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  acknowledgeAlert,
  fetchCrops,
  fetchMyAlerts,
  fetchMyFarms,
  fetchMyHarvests,
  fetchSensorReadings,
  fetchSensors,
  type Crop,
  type Harvest,
  type Sensor,
  type SensorAlert,
} from '../../api/client'
import { getSensorStatus } from '../../utils/sensorStatus'

type IrrigationTip = {
  sensor: Sensor
  value: number | null
  status: 'normal' | 'warning' | 'critical' | null
}

const IRRIGATION_MESSAGE: Record<'normal' | 'warning' | 'critical', string> = {
  normal: 'Solo com humidade adequada — não é necessário irrigar nas próximas 24h.',
  warning: 'Humidade a descer. Considera regar nas próximas horas.',
  critical: 'Solo muito seco. Rega urgente recomendada.',
}

const IRRIGATION_STYLE: Record<'normal' | 'warning' | 'critical', string> = {
  normal: 'bg-leaf-50 border-leaf-100 text-leaf-800',
  warning: 'bg-earth-50 border-earth-200 text-earth-800',
  critical: 'bg-[#fdf1ed] border-[#f0c9bd] text-[#8a3018]',
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0)
  return Math.round(diff / 86400000)
}

export default function Insights() {
  const { token } = useAuth()
  const [hasFarm, setHasFarm] = useState(true)
  const [tips, setTips] = useState<IrrigationTip[]>([])
  const [harvests, setHarvests] = useState<Harvest[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [alerts, setAlerts] = useState<SensorAlert[]>([])
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  useEffect(() => {
    if (!token) return
    let cancelled = false

    async function load() {
      const [farms, allSensors, myHarvests, myCrops, myAlerts] = await Promise.all([
        fetchMyFarms(token!),
        fetchSensors(),
        fetchMyHarvests(token!),
        fetchCrops(),
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

      const moistureSensors = allSensors.filter(
        (s) => s.farm_id === farm.id && s.type === 'soil_moisture',
      )
      const loadedTips = await Promise.all(
        moistureSensors.map(async (sensor) => {
          const readings = await fetchSensorReadings(sensor.id)
          const latest = readings[0] ?? null
          return {
            sensor,
            value: latest?.value ?? null,
            status: latest ? getSensorStatus('soil_moisture', latest.value) : null,
          }
        }),
      )

      if (cancelled) return
      setTips(loadedTips)
      setHarvests(myHarvests.filter((h) => h.status === 'planted' || h.status === 'growing'))
      setCrops(myCrops)
      setAlerts(myAlerts.filter((a) => !a.acknowledged))
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
    setAlerts((prev) => prev.filter((a) => a.id !== alertId))
  }

  if (status === 'loading') {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-leaf-50" />
        ))}
      </div>
    )
  }

  if (!hasFarm) {
    return (
      <div className="rounded-2xl border border-earth-200 bg-earth-50 p-6 text-center text-earth-800">
        <Sparkles className="mx-auto mb-2" size={32} />
        <p className="font-medium">Ainda não tens uma lavra registada.</p>
        <p className="mt-1 text-sm">Cria a tua lavra para começares a receber recomendações.</p>
      </div>
    )
  }

  const upcomingHarvests = [...harvests].sort(
    (a, b) => new Date(a.expected_harvest_at).getTime() - new Date(b.expected_harvest_at).getTime(),
  )

  return (
    <div className="space-y-8">
      {/* Risk alerts */}
      {alerts.length > 0 && (
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-leaf-950">
            <AlertCircle size={18} className="text-[#c1462b]" /> Alertas de risco
          </h2>
          <div className="mt-3 space-y-2.5">
            {alerts.map((alert) => (
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
                  Marcar como visto
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Irrigation recommendations */}
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-leaf-950">
          <Droplets size={18} className="text-leaf-700" /> Recomendações de irrigação
        </h2>
        {tips.length === 0 ? (
          <div className="mt-3 rounded-2xl bg-leaf-50 p-6 text-sm text-leaf-950/60">
            Sem sensores de humidade do solo registados.{' '}
            <Link to="/painel/monitorizacao" className="font-medium text-leaf-700 hover:underline">
              Configurar sensores
            </Link>
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {tips.map(({ sensor, value, status: st }) => (
              <div
                key={sensor.id}
                className={`rounded-2xl border p-4 ${st ? IRRIGATION_STYLE[st] : 'border-leaf-100 bg-leaf-50 text-leaf-950/60'}`}
              >
                <p className="text-sm font-semibold">{sensor.label || 'Sensor de humidade'}</p>
                <p className="mt-1 text-2xl font-bold">
                  {value !== null ? `${value.toLocaleString('pt-AO')}%` : '—'}
                </p>
                <p className="mt-1.5 text-sm">
                  {st ? IRRIGATION_MESSAGE[st] : 'Ainda sem leituras para dar uma recomendação.'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Harvest timing */}
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-leaf-950">
          <CalendarClock size={18} className="text-leaf-700" /> Altura de colheita
        </h2>
        {upcomingHarvests.length === 0 ? (
          <div className="mt-3 rounded-2xl bg-leaf-50 p-6 text-sm text-leaf-950/60">
            Sem colheitas em curso.{' '}
            <Link to="/painel/colheitas" className="font-medium text-leaf-700 hover:underline">
              Registar uma colheita
            </Link>
          </div>
        ) : (
          <div className="mt-3 space-y-2.5">
            {upcomingHarvests.map((h) => {
              const crop = crops.find((c) => c.id === h.crop_id)
              const days = daysUntil(h.expected_harvest_at)
              const soon = days <= 7

              return (
                <div
                  key={h.id}
                  className={`flex items-center gap-3 rounded-2xl border p-4 ${
                    soon ? 'border-earth-200 bg-earth-50' : 'border-leaf-100 bg-white'
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
                    <Sprout size={18} className="text-leaf-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-leaf-950">
                      {crop?.name ?? `Cultura #${h.crop_id}`}
                    </p>
                    <p className="text-sm text-leaf-950/70">
                      {days > 0
                        ? `Pronta a colher em ${days} dia${days === 1 ? '' : 's'}`
                        : days === 0
                          ? 'Pronta a colher hoje'
                          : `Atrasada ${Math.abs(days)} dia${Math.abs(days) === 1 ? '' : 's'}`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
