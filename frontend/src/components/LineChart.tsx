import { useState } from 'react'

type Point = { label: string; value: number }

const HEIGHT = 140
const PADDING_X = 12
const PADDING_Y = 16

export default function LineChart({
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
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const width = 320
  const innerWidth = width - PADDING_X * 2
  const innerHeight = HEIGHT - PADDING_Y * 2

  const points = data.map((d, i) => {
    const x = PADDING_X + (data.length === 1 ? innerWidth / 2 : (i / (data.length - 1)) * innerWidth)
    const y = PADDING_Y + innerHeight - ((d.value - min) / range) * innerHeight
    return { x, y, value: d.value, label: d.label }
  })

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const hovered = hoverIndex != null ? points[hoverIndex] : null

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={`Gráfico de ${data.length} pontos, mínimo ${min}${unit}, máximo ${max}${unit}`}
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
        <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hoverIndex === i ? 4.5 : 3}
            fill={color}
            className="cursor-pointer"
            onMouseEnter={() => setHoverIndex(i)}
          />
        ))}
        {points.map((p, i) => (
          <rect
            key={`hit-${i}`}
            x={p.x - 8}
            y={0}
            width={16}
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
      <div className="mt-1 flex justify-between text-[11px] font-semibold text-leaf-950/55">
        <span>
          min {min.toLocaleString('pt-AO')}
          {unit}
        </span>
        <span>
          max {max.toLocaleString('pt-AO')}
          {unit}
        </span>
      </div>
    </div>
  )
}
