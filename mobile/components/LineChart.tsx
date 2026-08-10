import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Line, Polyline } from 'react-native-svg'
import { colors } from '../theme/colors'

type Point = { label: string; value: number }

const HEIGHT = 140
const PADDING_X = 12
const PADDING_Y = 16

export default function LineChart({
  data,
  color = colors.leaf600,
  unit = '',
}: {
  data: Point[]
  color?: string
  unit?: string
}) {
  const [width, setWidth] = useState(0)

  if (data.length === 0) return null

  const values = data.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const innerWidth = Math.max(width - PADDING_X * 2, 1)
  const innerHeight = HEIGHT - PADDING_Y * 2

  const points = data.map((d, i) => {
    const x = PADDING_X + (data.length === 1 ? innerWidth / 2 : (i / (data.length - 1)) * innerWidth)
    const y = PADDING_Y + innerHeight - ((d.value - min) / range) * innerHeight
    return { x, y, value: d.value }
  })

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={HEIGHT}>
          <Line
            x1={PADDING_X}
            y1={HEIGHT - PADDING_Y}
            x2={width - PADDING_X}
            y2={HEIGHT - PADDING_Y}
            stroke={colors.leaf100}
            strokeWidth={1}
          />
          <Polyline points={polylinePoints} fill="none" stroke={color} strokeWidth={2.5} />
          {points.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={color} />
          ))}
        </Svg>
      )}

      <View style={styles.labelsRow}>
        <Text style={styles.label}>{data[0].label}</Text>
        <Text style={styles.label}>{data[data.length - 1].label}</Text>
      </View>

      <View style={styles.rangeRow}>
        <Text style={styles.rangeText}>
          min {min.toLocaleString('pt-AO')}
          {unit}
        </Text>
        <Text style={styles.rangeText}>
          max {max.toLocaleString('pt-AO')}
          {unit}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  label: {
    fontSize: 11,
    color: 'rgba(15,36,17,0.5)',
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  rangeText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(15,36,17,0.55)',
  },
})
