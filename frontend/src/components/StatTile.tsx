import type { LucideIcon } from 'lucide-react'
import type { TrendPoint } from '../api/client'

function trendFromSeries(series?: TrendPoint[]): { pct: number; hasData: boolean } | null {
  if (!series || series.length < 14) return null

  const last7 = series.slice(-7).reduce((sum, p) => sum + p.value, 0)
  const prev7 = series.slice(-14, -7).reduce((sum, p) => sum + p.value, 0)
  const hasData = last7 > 0 || prev7 > 0
  if (!hasData) return { pct: 0, hasData: false }

  if (prev7 === 0) return { pct: 100, hasData: true }
  return { pct: ((last7 - prev7) / prev7) * 100, hasData: true }
}

export default function StatTile({
  icon: Icon,
  label,
  value,
  trendSeries,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  trendSeries?: TrendPoint[]
}) {
  const trend = trendFromSeries(trendSeries)

  return (
    <div className="rounded-2xl border border-leaf-100 bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="inline-flex rounded-xl bg-leaf-700 p-2.5 text-white">
          <Icon size={18} />
        </div>
        {trend && trend.hasData && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              trend.pct >= 0 ? 'bg-leaf-100 text-leaf-700' : 'bg-earth-100 text-earth-700'
            }`}
          >
            {trend.pct >= 0 ? '▲' : '▼'} {Math.abs(Math.round(trend.pct))}%
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold text-leaf-950">{value}</p>
      <p className="text-sm text-leaf-950/60">{label}</p>
    </div>
  )
}
