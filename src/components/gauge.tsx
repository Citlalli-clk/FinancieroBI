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

  // Scale EXACTLY like Power BI: Start from a round number below value, end above budget
  const min = 60 // Fixed like Power BI
  const max = 150 // Fixed like Power BI
  
  const pct = Math.max(0.02, Math.min(0.98, (value - min) / (max - min)))
  const pyPct = Math.max(0, Math.min(1, (prevYear - min) / (max - min)))
  const budPct = Math.max(0, Math.min(1, (budget - min) / (max - min)))

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

  const cx = 200, cy = 180
  const ro = 155, ri = 105
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
  const z1e = p2a(pyPct), z2e = p2a(budPct)

  // Needle
  const na = p2a(anim)
  const nRad = (na * Math.PI) / 180
  const nLen = ro + 5
  const tip = { x: cx + nLen * Math.cos(nRad), y: cy + nLen * Math.sin(nRad) }
  const bw = 4
  const b1 = { x: cx + bw * Math.cos(nRad + Math.PI / 2), y: cy + bw * Math.sin(nRad + Math.PI / 2) }
  const b2 = { x: cx - bw * Math.cos(nRad + Math.PI / 2), y: cy - bw * Math.sin(nRad + Math.PI / 2) }

  // Scale marks every 5M like Power BI - positioned AROUND the arc
  const scaleMarks: number[] = []
  for (let v = min; v <= max; v += 5) {
    scaleMarks.push(v)
  }

  const GaugeContent = (
    <div className={`w-full h-full flex flex-col items-center ${clickable ? 'cursor-pointer' : ''}`}>
      <svg viewBox="0 0 400 240" className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="redZone" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C53030" />
            <stop offset="100%" stopColor="#E53E3E" />
          </linearGradient>
          <linearGradient id="yellowZone" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D69E2E" />
            <stop offset="100%" stopColor="#ECC94B" />
          </linearGradient>
          <linearGradient id="greenZone" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38A169" />
            <stop offset="100%" stopColor="#48BB78" />
          </linearGradient>
          <filter id="arcShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Background track */}
        <path d={descArc(startA, startA + sweepA, ro + 2, ri - 2)} fill="#E8E8E8" filter="url(#arcShadow)" />

        {/* Colored zones - THICK like Power BI */}
        <path d={descArc(startA, z1e, ro, ri)} fill="url(#redZone)" />
        <path d={descArc(z1e, z2e, ro, ri)} fill="url(#yellowZone)" />
        <path d={descArc(z2e, startA + sweepA, ro, ri)} fill="url(#greenZone)" />

        {/* SCALE LABELS around arc - EXACTLY like Power BI */}
        {scaleMarks.map((val, i) => {
          const pctVal = (val - min) / (max - min)
          const angle = p2a(pctVal)
          const labelR = ro + 20
          const pos = toXY(angle, labelR)
          const isBudget = val === 130 // Closest to budget
          const isPrevYear = val === 90 // Closest to prev year
          
          // Only show key values to avoid clutter: every 10M plus budget
          const showLabel = val % 10 === 0 || val === 130
          
          return showLabel ? (
            <text 
              key={i}
              x={pos.x} y={pos.y} 
              fontSize="9" 
              fill={isBudget ? "#276749" : isPrevYear ? "#C53030" : "#666"}
              textAnchor="middle" 
              dominantBaseline="middle"
              fontWeight={isBudget ? "700" : "500"}
            >
              ${val}.0M
            </text>
          ) : null
        })}

        {/* Budget marker - GREEN like Power BI */}
        {(() => {
          const angle = p2a(budPct)
          const pos = toXY(angle, ro + 22)
          return (
            <text x={pos.x} y={pos.y} fontSize="10" fill="#276749" textAnchor="middle" fontWeight="700">
              ${budget}M
            </text>
          )
        })()}

        {/* Needle */}
        <polygon points={`${tip.x},${tip.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`} fill="#333" />
        <circle cx={cx} cy={cy} r={10} fill="#555" />
        <circle cx={cx} cy={cy} r={5} fill="#888" />
      </svg>
      
      {/* Value BELOW gauge like Power BI - NO "de presupuesto" */}
      <div className="text-center -mt-4">
        <div className="text-4xl font-black text-gray-900">${value.toFixed(1)}M</div>
      </div>
    </div>
  )

  if (clickable) {
    return <Link href="/tabla-detalle" className="block w-full h-full">{GaugeContent}</Link>
  }
  
  return GaugeContent
}
