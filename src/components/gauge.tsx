"use client"

import Link from "next/link"

interface GaugeProps {
  value: number
  prevYear?: number
  budget?: number
  clickable?: boolean
  cumplimiento?: number
  crecimiento?: number
}

const COLOR_STOPS = [
  { pos: 0,    r: 0xE6, g: 0x28, b: 0x00 }, // #E62800 Pure Red
  { pos: 0.33, r: 0xF9, g: 0xDC, b: 0x5C }, // #F9DC5C Royal Gold
  { pos: 0.66, r: 0x60, g: 0xA6, b: 0x3A }, // #60A63A Sage Green
  { pos: 1,    r: 0x39, g: 0x83, b: 0xF6 }, // #3983F6 Azure Blue
]

function interpolateColor(t: number): string {
  const c = Math.max(0, Math.min(1, t))
  let i = 0
  for (let j = 0; j < COLOR_STOPS.length - 1; j++) {
    if (c >= COLOR_STOPS[j].pos) i = j
  }
  const a = COLOR_STOPS[i]
  const b = COLOR_STOPS[Math.min(i + 1, COLOR_STOPS.length - 1)]
  const f = b.pos === a.pos ? 0 : (c - a.pos) / (b.pos - a.pos)
  const r = Math.round(a.r + (b.r - a.r) * f)
  const g = Math.round(a.g + (b.g - a.g) * f)
  const bl = Math.round(a.b + (b.b - a.b) * f)
  return `rgb(${r},${g},${bl})`
}

export function Gauge({ value, clickable = true, cumplimiento = 0, crecimiento = 0 }: GaugeProps) {
  const W = 820
  const H = 720
  const cx = W / 2
  const cy = 380

  const outerR = 340
  const innerR = outerR * 0.75
  const outerGrayR = outerR + 5

  const segCount = 20
  const gapDeg = 2.5
  const totalGap = gapDeg * segCount
  const usableDeg = 180 - totalGap
  const segAngle = usableDeg / segCount

  const NEEDLE_PCT = 0.75

  function polarToXY(angleDeg: number, r: number): [number, number] {
    const rad = (angleDeg * Math.PI) / 180
    return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)]
  }

  const segments: { d: string; color: string }[] = []
  let currentAngle = 180
  for (let i = 0; i < segCount; i++) {
    const startDeg = currentAngle
    const endDeg = startDeg - segAngle

    const [ox1, oy1] = polarToXY(startDeg, outerR)
    const [ox2, oy2] = polarToXY(endDeg, outerR)
    const [ix1, iy1] = polarToXY(endDeg, innerR)
    const [ix2, iy2] = polarToXY(startDeg, innerR)

    const d = [
      `M ${ox1} ${oy1}`,
      `A ${outerR} ${outerR} 0 0 0 ${ox2} ${oy2}`,
      `L ${ix1} ${iy1}`,
      `A ${innerR} ${innerR} 0 0 1 ${ix2} ${iy2}`,
      `Z`,
    ].join(" ")

    const t = i / (segCount - 1)
    segments.push({ d, color: interpolateColor(t) })

    currentAngle = endDeg - gapDeg
  }

  const [gL_x, gL_y] = polarToXY(180, outerGrayR)
  const [gR_x, gR_y] = polarToXY(0, outerGrayR)
  const grayArc = `M ${gL_x} ${gL_y} A ${outerGrayR} ${outerGrayR} 0 0 1 ${gR_x} ${gR_y}`

  const needleAngleDeg = 180 - NEEDLE_PCT * 180
  const needleLen = outerR - 8
  const [tipX, tipY] = polarToXY(needleAngleDeg, needleLen)

  const baseHalfWidth = 7
  const perpRad = ((needleAngleDeg + 90) * Math.PI) / 180
  const b1x = cx + baseHalfWidth * Math.cos(perpRad)
  const b1y = cy - baseHalfWidth * Math.sin(perpRad)
  const b2x = cx - baseHalfWidth * Math.cos(perpRad)
  const b2y = cy + baseHalfWidth * Math.sin(perpRad)

  const tailLen = 20
  const [tailX, tailY] = polarToXY(needleAngleDeg + 180, tailLen)

  // Circle KPI positions (Mickey Mouse inverted: gauge on top, two circles below)
  const circleR = 62
  const circleY = cy + 200
  const circleLX = cx - 120
  const circleRX = cx + 120

  const content = (
    <div style={{ width: "100%", position: "relative" }}>
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: "block", overflow: "visible" }}
      >
        {/* Outer gray arc */}
        <path d={grayArc} fill="none" stroke="#D0D0D0" strokeWidth={2} />

        {/* Segmented color arc */}
        {segments.map((seg, i) => (
          <path key={i} d={seg.d} fill={seg.color} stroke="none" strokeWidth={0} />
        ))}

        {/* Thick needle */}
        <polygon
          points={`${tipX},${tipY} ${b1x},${b1y} ${tailX},${tailY} ${b2x},${b2y}`}
          fill="#052F5F"
        />

        {/* Pivot center */}
        <circle cx={cx} cy={cy} r={18} fill="#052F5F" />
        <circle cx={cx} cy={cy} r={11} fill="white" />
        <circle cx={cx} cy={cy} r={5} fill="#052F5F" />

        {/* KPI Value */}
        <text
          x={cx} y={cy + 60}
          fontSize="54" fontWeight="900" fill="#052F5F"
          textAnchor="middle" fontFamily="Calibri, Arial, sans-serif"
        >
          ${value.toFixed(1)}M
        </text>
        <text
          x={cx} y={cy + 95}
          fontSize="21" fill="#374151"
          textAnchor="middle" fontFamily="Calibri, Arial, sans-serif"
          fontWeight="700"
        >
          Prima neta cobrada
        </text>

        {/* Cumplimiento circle (left) */}
        <circle cx={circleLX} cy={circleY} r={circleR} fill="#3983F6" />
        <text
          x={circleLX} y={circleY + 8}
          fontSize="32" fontWeight="900" fill="white"
          textAnchor="middle" fontFamily="Calibri, Arial, sans-serif"
        >
          {cumplimiento}%
        </text>
        <text
          x={circleLX} y={circleY + circleR + 22}
          fontSize="14" fontWeight="700" fill="#374151"
          textAnchor="middle" fontFamily="Calibri, Arial, sans-serif"
        >
          Cumplimiento
        </text>

        {/* Crecimiento circle (right) */}
        <circle cx={circleRX} cy={circleY} r={circleR} fill={crecimiento < 0 ? '#E62800' : '#60A63A'} />
        <text
          x={circleRX} y={circleY + 8}
          fontSize="32" fontWeight="900" fill="white"
          textAnchor="middle" fontFamily="Calibri, Arial, sans-serif"
        >
          {crecimiento < 0 ? "↓" : "↑"} {crecimiento}%
        </text>
        <text
          x={circleRX} y={circleY + circleR + 22}
          fontSize="14" fontWeight="700" fill="#374151"
          textAnchor="middle" fontFamily="Calibri, Arial, sans-serif"
        >
          Crecimiento
        </text>
      </svg>
    </div>
  )

  if (clickable) {
    return (
      <Link href="/tabla-detalle" className="block">
        {content}
      </Link>
    )
  }
  return content
}
