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

export function Gauge({ value, budget = 129.5, clickable = true, cumplimiento = 0, crecimiento = 0 }: GaugeProps) {
  const W = 860
  const H = 720
  const cx = W / 2
  const cy = 390

  const outerR = 340
  const innerR = outerR * 0.75
  const labelR = outerR + 32

  // Premium semáforo zones - exactly 3 equal parts (1/3 each)
  // Zone 1 (left third): Deep navy - below expectations
  // Zone 2 (middle third): Rich amber/gold - approaching target
  // Zone 3 (right third): Deep emerald - exceeding target
  const zone1End = 1 / 3  // 33.33%
  const zone2End = 2 / 3  // 66.67%

  // Labels at 0%, 33%, 67%, 100% of arc
  const arcLabels = [
    { pct: 0, label: "$0M" },
    { pct: 0.33, label: `$${Math.round(budget * 0.33)}M` },
    { pct: 0.67, label: `$${Math.round(budget * 0.67)}M` },
    { pct: 1.0, label: `$${Math.round(budget)}M` },
  ]

  function polarToXY(angleDeg: number, r: number): [number, number] {
    const rad = (angleDeg * Math.PI) / 180
    return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)]
  }

  // Create arc path helper
  function createArcPath(startPct: number, endPct: number, outer: number, inner: number): string {
    const startAngle = 180 - startPct * 180
    const endAngle = 180 - endPct * 180
    const [outerStartX, outerStartY] = polarToXY(startAngle, outer)
    const [outerEndX, outerEndY] = polarToXY(endAngle, outer)
    const [innerEndX, innerEndY] = polarToXY(endAngle, inner)
    const [innerStartX, innerStartY] = polarToXY(startAngle, inner)
    const largeArc = Math.abs(endPct - startPct) > 0.5 ? 1 : 0
    return [
      `M ${outerStartX} ${outerStartY}`,
      `A ${outer} ${outer} 0 ${largeArc} 1 ${outerEndX} ${outerEndY}`,
      `L ${innerEndX} ${innerEndY}`,
      `A ${inner} ${inner} 0 ${largeArc} 0 ${innerStartX} ${innerStartY}`,
      `Z`,
    ].join(" ")
  }

  // Create the three zone arcs - exactly 1/3 each for premium look
  const navyArc = createArcPath(0, zone1End, outerR, innerR)     // Deep navy - below expectations
  const amberArc = createArcPath(zone1End, zone2End, outerR, innerR)  // Rich amber - approaching
  const emeraldArc = createArcPath(zone2End, 1, outerR, innerR)  // Deep emerald - exceeding

  // Dynamic needle angle based on actual cumplimiento (clamped to 0-100% for arc)
  const needleClampedPct = Math.min(Math.max(cumplimiento / 100, 0), 1.0)
  const needleAngleDeg = 180 - needleClampedPct * 180
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

  const tickR1 = outerR + 2
  const tickR2 = outerR + 12

  const circleR = 62
  const circleY = cy + 200
  const circleLX = cx - 120
  const circleRX = cx + 120

  const content = (
    <div style={{ width: "100%", position: "relative" }}>
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: "block" }}
      >
        <defs>
          <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.15)" />
          </filter>
        </defs>
        {/* Premium semáforo zones - elegant corporate colors */}
        <path d={navyArc} fill="#0A1628" />
        <path d={amberArc} fill="#C6922A" />
        <path d={emeraldArc} fill="#1B6B4A" />

        {/* Tick marks + labels OUTSIDE */}
        {arcLabels.map((tick, i) => {
          const angleDeg = 180 - tick.pct * 180
          const [t1x, t1y] = polarToXY(angleDeg, tickR1)
          const [t2x, t2y] = polarToXY(angleDeg, tickR2)
          const [lx, ly] = polarToXY(angleDeg, labelR)
          // Anchor: left labels start, right labels end, middle ones middle
          const anchor = tick.pct < 0.15 ? "start" : tick.pct > 0.85 ? "end" : "middle"
          // Push edge labels below the arc baseline so they don't overlap
          const yOffset = (tick.pct < 0.05 || tick.pct > 0.95) ? 20 : 0
          return (
            <g key={i}>
              <line x1={t1x} y1={t1y} x2={t2x} y2={t2y} stroke="#8896A6" strokeWidth={1.5} />
              <text
                x={lx} y={ly + yOffset}
                fontSize="15" fontWeight="500" fill="#4A5568"
                textAnchor={anchor}
                dominantBaseline="middle"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                {tick.label}
              </text>
            </g>
          )
        })}

        <polygon
          points={`${tipX},${tipY} ${b1x},${b1y} ${tailX},${tailY} ${b2x},${b2y}`}
          fill="#2D3748"
        />

        <circle cx={cx} cy={cy} r={18} fill="#2D3748" />
        <circle cx={cx} cy={cy} r={11} fill="white" />
        <circle cx={cx} cy={cy} r={5} fill="#2D3748" />

        {/* Prominent % achievement in center */}
        <text
          x={cx} y={cy + 55}
          fontSize="58" fontWeight="900" fill="#0A1628"
          textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif"
          style={{ fontFeatureSettings: "'tnum'" }}
        >
          {cumplimiento}%
        </text>
        <text
          x={cx} y={cy + 90}
          fontSize="21" fill="#4A5568"
          textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="600"
        >
          Cumplimiento
        </text>
        <text
          x={cx} y={cy + 120}
          fontSize="18" fill="#8896A6"
          textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif"
        >
          ${value.toFixed(1)}M de ${budget.toFixed(1)}M
        </text>

        {/* Bottom circles with subtle drop shadow */}
        <circle cx={circleLX} cy={circleY} r={circleR} fill="#0A1628" filter="url(#dropShadow)" />
        <text
          x={circleLX} y={circleY + 8}
          fontSize="32" fontWeight="900" fill="white"
          textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif"
          style={{ fontFeatureSettings: "'tnum'" }}
        >
          ${value.toFixed(1)}M
        </text>
        <text
          x={circleLX} y={circleY + circleR + 22}
          fontSize="14" fontWeight="600" fill="#4A5568"
          textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif"
        >
          Prima Neta
        </text>

        <circle cx={circleRX} cy={circleY} r={circleR} fill={crecimiento < 0 ? '#8B2500' : '#1B6B4A'} filter="url(#dropShadow)" />
        <text
          x={circleRX} y={circleY + 8}
          fontSize="32" fontWeight="900" fill="white"
          textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif"
          style={{ fontFeatureSettings: "'tnum'" }}
        >
          {crecimiento < 0 ? "↓" : "↑"}{Math.abs(crecimiento)}%
        </text>
        <text
          x={circleRX} y={circleY + circleR + 22}
          fontSize="14" fontWeight="600" fill="#4A5568"
          textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif"
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
