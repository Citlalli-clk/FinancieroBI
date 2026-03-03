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

  // HARDCODED 75% for UI review
  const HARDCODE_PCT = 0.75

  useEffect(() => {
    const dur = 1400, t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1)
      setAnim(HARDCODE_PCT * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [])

  // ─── SVG Geometry ───
  // Semicircle: left to right, arc goes UPWARD
  // In SVG coords (Y down): angle 180° = left, 0° = right
  // To go UP from left to right = counter-clockwise (sweep-flag=0)
  const W = 500, H = 290
  const cx = W / 2, cy = 255
  const ro = 210
  const ri = 155
  const borderR = ro + 8
  const numSegs = 10
  const gapDeg = 2

  // pct 0=left, 1=right. Angle: 180° down to 0°
  const pctToAngle = (p: number) => Math.PI - p * Math.PI  // 180°→0° in radians

  const toXY = (p: number, r: number) => {
    const a = pctToAngle(p)
    return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) }
    // Note: cy - r*sin because SVG Y is inverted; sin>0 should go UP
  }

  // Arc from p1 to p2 (0→1 = left→right)
  // Points go left-to-right, arc bulges upward = large arc with sweep=0
  const descArc = (p1: number, p2: number, rOut: number, rIn: number) => {
    const s = toXY(p1, rOut), e = toXY(p2, rOut)
    const eI = toXY(p2, rIn), sI = toXY(p1, rIn)
    const sweepDeg = (p2 - p1) * 180
    const lg = sweepDeg > 90 ? 1 : 0
    // sweep=0 = counter-clockwise in SVG = goes upward from left to right
    return `M${s.x},${s.y} A${rOut},${rOut} 0 ${lg} 0 ${e.x},${e.y} L${eI.x},${eI.y} A${rIn},${rIn} 0 ${lg} 1 ${sI.x},${sI.y} Z`
  }

  // Colors
  const colors = [
    "#1B8A2D", "#2DA83E", "#6BBF1A", "#C5D900", "#F5D000",
    "#F5A623", "#F57C00", "#E64A19", "#D32F2F", "#B71C1C",
  ]

  const totalGapPct = (gapDeg * (numSegs - 1)) / 180
  const segPct = (1 - totalGapPct) / numSegs
  const gapPct = gapDeg / 180

  // Needle at 75% hardcoded
  const nA = pctToAngle(anim)
  const needleTip = { x: cx + (ro - 5) * Math.cos(nA), y: cy - (ro - 5) * Math.sin(nA) }
  const bw = 9
  const b1 = { x: cx + bw * Math.cos(nA + Math.PI / 2), y: cy - bw * Math.sin(nA + Math.PI / 2) }
  const b2 = { x: cx + bw * Math.cos(nA - Math.PI / 2), y: cy - bw * Math.sin(nA - Math.PI / 2) }

  // Scale
  const min = 80, max = 150, range = max - min
  const scaleCount = 8
  const scaleValues = Array.from({ length: scaleCount + 1 }, (_, i) => ({
    val: min + (range * i) / scaleCount,
    pct: i / scaleCount
  }))

  const budPct = Math.max(0, Math.min(1, (budget - min) / range))
  const pyPct = Math.max(0, Math.min(1, (prevYear - min) / range))

  const GaugeContent = (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full mx-auto block" style={{ overflow: "hidden" }}>
      {/* Clip: nothing renders below cy */}
      <defs>
        <clipPath id="semiClip">
          <rect x="0" y="0" width={W} height={cy + 1} />
        </clipPath>
      </defs>

      <g clipPath="url(#semiClip)">
        {/* Grey outer border */}
        <path d={descArc(-0.005, 1.005, borderR, borderR - 7)} fill="#6B6B6B" />

        {/* Background */}
        <path d={descArc(0, 1, ro, ri)} fill="#D1D5DB" />

        {/* 10 color blocks with gaps */}
        {colors.map((color, i) => {
          const sP = i * (segPct + gapPct)
          const eP = sP + segPct
          return <path key={i} d={descArc(sP, eP, ro, ri)} fill={color} />
        })}

        {/* Scale ticks and labels */}
        {scaleValues.map(({ val, pct: p }) => {
          const outer = toXY(p, ro + 12)
          const inner = toXY(p, ro + 2)
          const label = toXY(p, ro + 26)
          return (
            <g key={val}>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#4B5563" strokeWidth={2} />
              <text x={label.x} y={label.y} fontSize="11" fill="#4B5563"
                textAnchor="middle" dominantBaseline="middle" fontWeight="600" fontFamily="Calibri, sans-serif">
                ${val.toFixed(0)}M
              </text>
            </g>
          )
        })}

        {/* Budget marker */}
        {(() => {
          const bLabel = toXY(budPct, ro + 38)
          return (
            <text x={bLabel.x} y={bLabel.y} fontSize="10" fill="#15803D"
              textAnchor="middle" dominantBaseline="middle" fontWeight="800" fontFamily="Calibri, sans-serif">
              Meta: ${budget.toFixed(1)}M
            </text>
          )
        })()}

        {/* Previous year dashed line */}
        {(() => {
          const outer = toXY(pyPct, ro + 3)
          const inner = toXY(pyPct, ri - 5)
          return <line x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} stroke="#1F2937" strokeWidth={3} strokeDasharray="6 3" />
        })()}

        {/* Needle */}
        <polygon points={`${needleTip.x},${needleTip.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`}
          fill="#2D2D2D" stroke="#1a1a1a" strokeWidth={1} />

        {/* Center hub */}
        <circle cx={cx} cy={cy} r={24} fill="#F5F5F5" stroke="#BDBDBD" strokeWidth={3} />
        <circle cx={cx} cy={cy} r={14} fill="#E0E0E0" stroke="#9E9E9E" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={6} fill="#757575" />
      </g>

      {/* Labels ON the base line */}
      <text x={cx - ro - 15} y={cy + 18} fontSize="13" fill="#1B8A2D"
        textAnchor="middle" fontWeight="900" fontFamily="Calibri, sans-serif" letterSpacing="2">LOW</text>
      <text x={cx + ro + 20} y={cy + 18} fontSize="13" fill="#B71C1C"
        textAnchor="middle" fontWeight="900" fontFamily="Calibri, sans-serif" letterSpacing="1">CRITICAL</text>

      {/* Value */}
      <text x={cx} y={cy + 40} fontSize="38" fontWeight="900" fill="#111827"
        textAnchor="middle" fontFamily="Calibri, sans-serif">${value.toFixed(1)}M</text>
      <text x={cx} y={cy + 58} fontSize="12" fill="#6B7280"
        textAnchor="middle" fontFamily="Calibri, sans-serif" fontWeight="500">Prima neta cobrada</text>
    </svg>
  )

  if (clickable) return <Link href="/tabla-detalle" className="block">{GaugeContent}</Link>
  return GaugeContent
}
