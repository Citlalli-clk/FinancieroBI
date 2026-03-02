"use client"

import { useEffect, useState } from "react"

interface CylinderProps {
  value: number
  maxValue: number
  pct: number
  objective: number
}

export function Cylinder({ value, maxValue, pct, objective }: CylinderProps) {
  const [fillPct, setFillPct] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setFillPct(pct), 100)
    return () => clearTimeout(timer)
  }, [pct])

  const w = 90, h = 200, rx = 45, ry = 16
  const left = 80, top = 20, bot = top + h
  const fillH = (fillPct / 100) * h
  const fillTop = bot - fillH

  const scaleValues = [2585.64, 2100.83, 1616.02, 1131.22, 646.41]
  const fmtM = (v: number) => `${v.toFixed(2)}M`
  const diff = pct - objective

  return (
    <svg viewBox="0 0 300 280" className="w-full max-w-[260px]">
      <defs>
        <linearGradient id="brandGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#041224" />
          <stop offset="50%" stopColor="#0a2540" />
          <stop offset="100%" stopColor="#041224" />
        </linearGradient>
      </defs>

      {/* Cylinder body - empty */}
      <rect x={left} y={top} width={w} height={h} fill="#E5E7E9" />

      {/* Cylinder body - filled with brand gradient */}
      <rect x={left} y={fillTop} width={w} height={fillH}
        fill="url(#brandGrad)" className="transition-all duration-[1200ms] ease-out" />

      {/* Bottom ellipse */}
      <ellipse cx={left + rx} cy={bot} rx={rx} ry={ry} fill="#041224" />

      {/* Top of fill ellipse */}
      {fillPct > 0 && fillPct < 100 && (
        <ellipse cx={left + rx} cy={fillTop} rx={rx} ry={ry}
          fill="#E62800" className="transition-all duration-[1200ms] ease-out" />
      )}

      {/* Top cap */}
      <ellipse cx={left + rx} cy={top} rx={rx} ry={ry} fill="#CCD1D3" stroke="#bbb" strokeWidth={0.5} />

      {/* Side edges */}
      <line x1={left} y1={top} x2={left} y2={bot} stroke="#bbb" strokeWidth={0.5} />
      <line x1={left + w} y1={top} x2={left + w} y2={bot} stroke="#bbb" strokeWidth={0.5} />

      {/* Red dashed objective line */}
      <line x1={left - 8} y1={fillTop} x2={left + w + 8} y2={fillTop}
        stroke="#E62800" strokeWidth={1.5} strokeDasharray="4 2"
        className="transition-all duration-[1200ms] ease-out" />

      {/* Value centered in cylinder */}
      <text x={left + rx} y={fillTop + fillH / 2 + 4} textAnchor="middle"
        fill="white" fontSize="14" fontWeight="bold" fontFamily="Lato, system-ui"
        className="transition-all duration-[1200ms]">
        {fmtM(value / 1e6)}
      </text>

      {/* Scale on right side */}
      {scaleValues.map((sv, i) => {
        const y = top + (h / (scaleValues.length - 1)) * i
        return (
          <g key={i}>
            <line x1={left + w + 4} y1={y} x2={left + w + 10} y2={y} stroke="#CCD1D3" strokeWidth={0.5} />
            <text x={left + w + 14} y={y + 3} fontSize="8" fill="#CCD1D3" fontFamily="Lato">{sv.toFixed(2)}M</text>
          </g>
        )
      })}

      {/* Percentage */}
      <text x={left + w + 14} y={fillTop - 8} fontSize="16" fontWeight="bold" fill="#E62800" fontFamily="Lato">
        ↑ {pct.toFixed(1)}%
      </text>
      <text x={left + w + 14} y={fillTop + 8} fontSize="9" fill="#CCD1D3" fontFamily="Lato">
        Obj: {objective}% ({diff >= 0 ? "+" : ""}{diff.toFixed(2)}%)
      </text>

      {/* Label */}
      <text x={left + rx} y={bot + 32} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#041224" fontFamily="Lato">
        META ANUAL
      </text>
    </svg>
  )
}
