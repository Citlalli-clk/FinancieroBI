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
  const pyPct = Math.max(0, Math.min(1, (prevYear - min) / range))
  const budPct = Math.max(0, Math.min(1, (budget - min) / range))

  useEffect(() => {
    const dur = 1200, t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1)
      setAnim(pct * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [pct])

  // SVG geometry
  const cx = 200, cy = 160
  const ro = 120, ri = 92 // thinner arc band
  const startA = 150, sweepA = 240

  const toXY = (deg: number, r: number) => {
    const rad = (deg * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  const descArc = (s: number, e: number, rOut: number, rIn: number) => {
    const p1 = toXY(s, rOut), p2 = toXY(e, rOut), p3 = toXY(e, rIn), p4 = toXY(s, rIn)
    const lg = (e - s) > 180 ? 1 : 0
    return `M${p1.x},${p1.y} A${rOut},${rOut} 0 ${lg} 1 ${p2.x},${p2.y} L${p3.x},${p3.y} A${rIn},${rIn} 0 ${lg} 0 ${p4.x},${p4.y} Z`
  }

  const p2a = (p: number) => startA + p * sweepA

  // 5 color segments across the arc
  const segments = [
    { from: 0, to: 0.2, color: "#16a34a" },      // green
    { from: 0.2, to: 0.4, color: "#84cc16" },     // yellow-green
    { from: 0.4, to: 0.6, color: "#eab308" },     // yellow
    { from: 0.6, to: 0.8, color: "#f97316" },     // orange
    { from: 0.8, to: 1.0, color: "#dc2626" },     // red
  ]

  // Needle
  const na = p2a(anim)
  const nRad = (na * Math.PI) / 180
  const needleLen = ro + 4
  const tip = { x: cx + needleLen * Math.cos(nRad), y: cy + needleLen * Math.sin(nRad) }
  const bw = 3.5
  const b1 = { x: cx + bw * Math.cos(nRad + Math.PI / 2), y: cy + bw * Math.sin(nRad + Math.PI / 2) }
  const b2 = { x: cx - bw * Math.cos(nRad + Math.PI / 2), y: cy - bw * Math.sin(nRad + Math.PI / 2) }

  // Scale labels
  const scaleValues = [80, 90, 100, 110, 120, 130, 140, 150]

  // Budget marker position
  const budAngle = p2a(budPct)

  const GaugeContent = (
    <svg viewBox="0 0 400 210" className="w-full mx-auto block">
      {/* Background track */}
      <path d={descArc(startA, startA + sweepA, ro + 1, ri - 1)} fill="#e5e7eb" />

      {/* Color segments */}
      {segments.map((seg, i) => (
        <path key={i} d={descArc(p2a(seg.from), p2a(seg.to), ro, ri)} fill={seg.color} />
      ))}

      {/* Tick marks and labels */}
      {scaleValues.map(val => {
        const valPct = (val - min) / range
        const angle = p2a(valPct)
        const outerTick = toXY(angle, ro + 3)
        const innerTick = toXY(angle, ro + 8)
        const labelPos = toXY(angle, ro + 18)
        return (
          <g key={val}>
            <line x1={outerTick.x} y1={outerTick.y} x2={innerTick.x} y2={innerTick.y} stroke="#6b7280" strokeWidth={1.5} />
            <text x={labelPos.x} y={labelPos.y} fontSize="8" fill="#6b7280" textAnchor="middle" dominantBaseline="middle" fontWeight="500">
              ${val}M
            </text>
          </g>
        )
      })}

      {/* Budget marker */}
      {(() => {
        const bPos = toXY(budAngle, ro + 26)
        return (
          <text x={bPos.x} y={bPos.y} fontSize="9" fill="#15803d" textAnchor="middle" dominantBaseline="middle" fontWeight="700">
            Meta: ${budget.toFixed(1)}M
          </text>
        )
      })()}

      {/* Previous year marker line */}
      {(() => {
        const pyAngle = p2a(pyPct)
        const pyOuter = toXY(pyAngle, ro + 2)
        const pyInner = toXY(pyAngle, ri - 2)
        return <line x1={pyOuter.x} y1={pyOuter.y} x2={pyInner.x} y2={pyInner.y} stroke="#1f2937" strokeWidth={2} strokeDasharray="4 2" />
      })()}

      {/* Needle */}
      <polygon points={`${tip.x},${tip.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`} fill="#1f2937" />
      <circle cx={cx} cy={cy} r={8} fill="#374151" />
      <circle cx={cx} cy={cy} r={4} fill="#6b7280" />

      {/* Value text centered */}
      <text x={cx} y={cy + 36} fontSize="28" fontWeight="900" fill="#111827" textAnchor="middle">${value.toFixed(1)}M</text>
      <text x={cx} y={cy + 50} fontSize="9" fill="#9ca3af" textAnchor="middle">Prima neta cobrada</text>
    </svg>
  )

  if (clickable) {
    return <Link href="/tabla-detalle" className="block">{GaugeContent}</Link>
  }
  return GaugeContent
}
