import { useState } from 'react'

type Point = { label: string; value: number }

const HEIGHT = 140
const PADDING_X = 12
const PADDING_Y = 16
const GAP = 2

export default function BarChart({
  data,
  color = '#2b632a',
  unit = '',
}: {
  data: Point[]
  color?: string
  unit?: string
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  if (data.length === 0) return null

  const values = data.map((d) => d.value)
  const max = Math.max(...values, 1)

  const width = 320
  const innerWidth = width - PADDING_X * 2
  const innerHeight = HEIGHT - PADDING_Y * 2
  const barWidth = Math.max(innerWidth / data.length - GAP, 1)

  const bars = data.map((d, i) => {
    const x = PADDING_X + i * (barWidth + GAP)
    const barHeight = (d.value / max) * innerHeight
    const y = PADDING_Y + innerHeight - barHeight
    return { x, y, barHeight, value: d.value, label: d.label }
  })

  const hovered = hoverIndex != null ? bars[hoverIndex] : null

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={`Gráfico de barras de ${data.length} pontos, máximo ${max}${unit}`}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <line
          x1={PADDING_X}
          y1={HEIGHT - PADDING_Y}
          x2={width - PADDING_X}
          y2={HEIGHT - PADDING_Y}
          stroke="#e0f3de"
          strokeWidth={1}
        />
        {bars.map((b, i) => (
          <rect
            key={i}
            x={b.x}
            y={b.y}
            width={barWidth}
            height={Math.max(b.barHeight, 1)}
            rx={Math.min(barWidth / 2, 4)}
            fill={color}
            opacity={hoverIndex === i ? 1 : 0.85}
            className="cursor-pointer"
            onMouseEnter={() => setHoverIndex(i)}
          />
        ))}
        {bars.map((b, i) => (
          <rect
            key={`hit-${i}`}
            x={b.x}
            y={0}
            width={barWidth}
            height={HEIGHT}
            fill="transparent"
            className="cursor-pointer"
            onMouseEnter={() => setHoverIndex(i)}
          />
        ))}
      </svg>

      {hovered && (
        <p className="text-center text-xs font-medium text-leaf-950/70">
          {hovered.label}: {hovered.value.toLocaleString('pt-AO')}
          {unit}
        </p>
      )}

      <div className="mt-0.5 flex justify-between text-[11px] text-leaf-950/50">
        <span>{data[0].label}</span>
        <span>{data[data.length - 1].label}</span>
      </div>
    </div>
  )
}
