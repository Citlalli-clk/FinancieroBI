"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

interface GaugeProps {
  value: number
  prevYear?: number
  budget?: number
  clickable?: boolean
}

export function Gauge({ value, prevYear = 88.9, budget = 129.5, clickable = true }: GaugeProps) {
  const [anim, setAnim] = useState(0)
  const raf = useRef(0)

  const min = 80, max = 150
  const range = max - min
  const pct = Math.max(0.01, Math.min(0.99, (value - min) / range))

  useEffect(() => {
    const dur = 1400, t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1)
      setAnim(pct * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [pct])

  // ─── SVG Geometry: PERFECT 180° semicircle ───
  // In SVG/math: 0° = right, goes clockwise in SVG coords
  // For a semicircle with FLAT BASE: arc from left (180°) sweeping UPWARD to right (0°/360°)
  // Using negative Y convention: 180° = left, 270° = top, 360° = right
  const W = 500, H = 300
  const cx = W / 2, cy = 250       // center at bottom of semicircle
  const ro = 200                    // outer radius (massive)
  const ri = 145                    // inner radius (thick 55px band)
  const borderR = ro + 8            // grey outer border
  const numSegs = 10
  const gapDeg = 2

  // Convert angle (0=left/180°, 1=right/360°) to SVG coordinates
  // 0% = 180° (left), 100% = 360° (right), going through 270° (top)
  const pctToRad = (p: number) => {
    const angleDeg = 180 + p * 180  // 180° to 360°
    return (angleDeg * Math.PI) / 180
  }

  const toXY = (pctVal: number, r: number) => {
    const rad = pctToRad(pctVal)
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  // Arc path from pct1 to pct2
  const descArc = (p1: number, p2: number, rOut: number, rIn: number) => {
    const start = toXY(p1, rOut)
    const end = toXY(p2, rOut)
    const endIn = toXY(p2, rIn)
    const startIn = toXY(p1, rIn)
    const sweep = (p2 - p1) * 180
    const lg = sweep > 180 ? 1 : 0
    return `M${start.x},${start.y} A${rOut},${rOut} 0 ${lg} 1 ${end.x},${end.y} L${endIn.x},${endIn.y} A${rIn},${rIn} 0 ${lg} 0 ${startIn.x},${startIn.y} Z`
  }

  // ─── Color segments: 10 blocks, GREEN → YELLOW → ORANGE → RED ───
  // Vibrant, high-contrast, Power BI Premium — NO PASTELS
  const colors = [
    "#1B8A2D", "#2DA83E", "#6BBF1A", "#C5D900", "#F5D000",
    "#F5A623", "#F57C00", "#E64A19", "#D32F2F", "#B71C1C",
  ]

  const totalGapPct = (gapDeg * (numSegs - 1)) / 180
  const segPct = (1 - totalGapPct) / numSegs
  const gapPct = gapDeg / 180

  // ─── Needle at animated position ───
  const needlePct = anim
  const needleRad = pctToRad(needlePct)
  const needleTip = { x: cx + (ro - 6) * Math.cos(needleRad), y: cy + (ro - 6) * Math.sin(needleRad) }
  const bw = 9
  const b1 = { x: cx + bw * Math.cos(needleRad + Math.PI / 2), y: cy + bw * Math.sin(needleRad + Math.PI / 2) }
  const b2 = { x: cx + bw * Math.cos(needleRad - Math.PI / 2), y: cy + bw * Math.sin(needleRad - Math.PI / 2) }

  // ─── Scale labels ───
  const scaleCount = 8
  const scaleValues = Array.from({ length: scaleCount + 1 }, (_, i) => ({
    val: min + (range * i) / scaleCount,
    pct: i / scaleCount
  }))

  // Budget & prev year
  const budPct = Math.max(0, Math.min(1, (budget - min) / range))
  const pyPct = Math.max(0, Math.min(1, (prevYear - min) / range))

  const GaugeContent = (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full mx-auto block">
      {/* Grey outer border arc — full semicircle */}
      <path d={descArc(-0.005, 1.005, borderR, borderR - 7)} fill="#6B6B6B" />

      {/* Background track */}
      <path d={descArc(0, 1, ro, ri)} fill="#D1D5DB" />

      {/* 10 color segment blocks with gaps */}
      {colors.map((color, i) => {
        const sP = i * (segPct + gapPct)
        const eP = sP + segPct
        return <path key={i} d={descArc(sP, eP, ro, ri)} fill={color} />
      })}

      {/* Scale tick marks and $ labels */}
      {scaleValues.map(({ val, pct: p }) => {
        const outer = toXY(p, ro + 12)
        const inner = toXY(p, ro + 2)
        const label = toXY(p, ro + 26)
        return (
          <g key={val}>
            <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
              stroke="#4B5563" strokeWidth={2} />
            <text x={label.x} y={label.y} fontSize="11" fill="#4B5563"
              textAnchor="middle" dominantBaseline="middle" fontWeight="600"
              fontFamily="Calibri, sans-serif">
              ${val.toFixed(0)}M
            </text>
          </g>
        )
      })}

      {/* Budget marker */}
      {(() => {
        const bOuter = toXY(budPct, ro + 12)
        const bLabel = toXY(budPct, ro + 40)
        const tri1 = toXY(budPct - 0.01, ro + 20)
        const tri2 = toXY(budPct + 0.01, ro + 20)
        return (
          <g>
            <polygon points={`${bOuter.x},${bOuter.y} ${tri1.x},${tri1.y} ${tri2.x},${tri2.y}`} fill="#15803D" />
            <text x={bLabel.x} y={bLabel.y} fontSize="10" fill="#15803D"
              textAnchor="middle" dominantBaseline="middle" fontWeight="800"
              fontFamily="Calibri, sans-serif">
              Meta: ${budget.toFixed(1)}M
            </text>
          </g>
        )
      })()}

      {/* Previous year marker line */}
      {(() => {
        const outer = toXY(pyPct, ro + 3)
        const inner = toXY(pyPct, ri - 5)
        return <line x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y}
          stroke="#1F2937" strokeWidth={3} strokeDasharray="6 3" />
      })()}

      {/* Robust needle */}
      <polygon
        points={`${needleTip.x},${needleTip.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`}
        fill="#2D2D2D" stroke="#1a1a1a" strokeWidth={1}
      />

      {/* Large center hub — white/grey like reference */}
      <circle cx={cx} cy={cy} r={24} fill="#F5F5F5" stroke="#BDBDBD" strokeWidth={3} />
      <circle cx={cx} cy={cy} r={14} fill="#E0E0E0" stroke="#9E9E9E" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={6} fill="#757575" />

      {/* Flat base line */}
      <line x1={cx - ro - 12} y1={cy} x2={cx + ro + 12} y2={cy} stroke="#E5E7EB" strokeWidth={1} />

      {/* LOW label — left, aligned to flat base */}
      <text x={cx - ro - 5} y={cy + 22} fontSize="14" fill="#1B8A2D"
        textAnchor="middle" fontWeight="900" fontFamily="Calibri, sans-serif"
        letterSpacing="2">
        LOW
      </text>

      {/* CRITICAL label — right, aligned to flat base */}
      <text x={cx + ro + 12} y={cy + 22} fontSize="14" fill="#B71C1C"
        textAnchor="middle" fontWeight="900" fontFamily="Calibri, sans-serif"
        letterSpacing="1">
        CRITICAL
      </text>

      {/* Value text — bold, centered below */}
      <text x={cx} y={cy + 45} fontSize="38" fontWeight="900" fill="#111827"
        textAnchor="middle" fontFamily="Calibri, sans-serif">
        ${value.toFixed(1)}M
      </text>
      <text x={cx} y={cy + 64} fontSize="12" fill="#6B7280"
        textAnchor="middle" fontFamily="Calibri, sans-serif" fontWeight="500">
        Prima neta cobrada
      </text>
    </svg>
  )

  if (clickable) {
    return <Link href="/tabla-detalle" className="block">{GaugeContent}</Link>
  }
  return GaugeContent
}
