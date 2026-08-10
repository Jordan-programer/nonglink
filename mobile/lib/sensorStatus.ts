import type { SensorType } from './api'

export type SensorStatus = 'normal' | 'warning' | 'critical'

// Mirrors backend/app/services/sensor_ingest.py's CRITICAL_THRESHOLDS, plus a
// warning buffer band on top for the traffic-light indicator in the UI —
// the backend only raises alerts at the critical line.
const THRESHOLDS: Record<SensorType, { min?: number; max?: number; warnBuffer: number }> = {
  soil_moisture: { min: 20, warnBuffer: 10 },
  temperature: { min: 5, max: 38, warnBuffer: 5 },
  humidity: { min: 30, warnBuffer: 10 },
  water_level: { min: 10, warnBuffer: 10 },
}

export function getSensorStatus(type: SensorType, value: number): SensorStatus {
  const t = THRESHOLDS[type]
  if (t.min !== undefined) {
    if (value < t.min) return 'critical'
    if (value < t.min + t.warnBuffer) return 'warning'
  }
  if (t.max !== undefined) {
    if (value > t.max) return 'critical'
    if (value > t.max - t.warnBuffer) return 'warning'
  }
  return 'normal'
}

export const SENSOR_ICONS: Record<SensorType, string> = {
  soil_moisture: 'water-percent',
  temperature: 'thermometer',
  humidity: 'water-outline',
  water_level: 'waves',
}

export const SENSOR_UNITS: Record<SensorType, string> = {
  soil_moisture: '%',
  temperature: '°C',
  humidity: '%',
  water_level: '%',
}
