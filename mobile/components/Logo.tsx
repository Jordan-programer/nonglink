import Svg, { Defs, LinearGradient, Path, Rect, Stop, G } from 'react-native-svg'

export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <LinearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#3FA34D" />
          <Stop offset="100%" stopColor="#1F6B32" />
        </LinearGradient>
        <LinearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#F2B24A" />
          <Stop offset="100%" stopColor="#D98E23" />
        </LinearGradient>
      </Defs>

      <Rect x={0} y={0} width={200} height={200} rx={40} fill="#F4EFE2" />

      <G transform="translate(100,104)">
        <Rect
          x={-52}
          y={-22}
          width={104}
          height={44}
          rx={22}
          transform="rotate(-28)"
          fill="none"
          stroke="url(#goldGrad)"
          strokeWidth={20}
        />
        <Rect
          x={-52}
          y={-22}
          width={104}
          height={44}
          rx={22}
          transform="rotate(28) translate(5,-3)"
          fill="none"
          stroke="url(#leafGrad)"
          strokeWidth={20}
        />
        <Path
          d="M 0 -62 C 12 -84 34 -90 50 -85 C 40 -69 20 -59 0 -62 Z"
          fill="url(#leafGrad)"
        />
      </G>
    </Svg>
  )
}
