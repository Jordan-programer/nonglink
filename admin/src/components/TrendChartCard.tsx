import type { TrendPoint } from '../api/client'
import LineChart from './LineChart'
import BarChart from './BarChart'

const MIN_NONZERO_DAYS = 3

export default function TrendChartCard({
  title,
  subtitle,
  series,
  kind = 'line',
  color = '#2b632a',
  unit = '',
}: {
  title: string
  subtitle?: string
  series: TrendPoint[]
  kind?: 'line' | 'bar'
  color?: string
  unit?: string
}) {
  const nonzeroDays = series.filter((p) => p.value > 0).length
  const hasEnoughData = nonzeroDays >= MIN_NONZERO_DAYS

  const data = series.map((p) => ({ label: p.day.slice(5), value: p.value }))
  const Chart = kind === 'bar' ? BarChart : LineChart

  return (
    <div className="rounded-2xl border border-leaf-100 bg-white p-5">
      <p className="text-sm font-semibold text-leaf-950">{title}</p>
      {subtitle && <p className="text-xs text-leaf-950/55">{subtitle}</p>}

      <div className="mt-4">
        {hasEnoughData ? (
          <Chart data={data} color={color} unit={unit} />
        ) : (
          <div className="flex h-[140px] items-center justify-center text-center text-xs text-leaf-950/45">
            Sem dados suficientes ainda
            <br />
            para mostrar uma tendência.
          </div>
        )}
      </div>
    </div>
  )
}
