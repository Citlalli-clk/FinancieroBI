"use client"

import { useEffect, useState } from "react"

interface TankProps {
  value: number      // actual amount
  total: number      // total/target amount
  pct: number        // percentage
  label: string
  objective: number  // objective %
}

export function Tank({ value, total, pct, label, objective }: TankProps) {
  const [fillPct, setFillPct] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setFillPct(pct), 100)
    return () => clearTimeout(timer)
  }, [pct])

  // Tank dimensions
  const tankW = 100
  const tankH = 160
  const rx = 50   // ellipse horizontal radius
  const ry = 14   // ellipse vertical radius
  const topY = 20
  const botY = topY + tankH

  // Fill level
  const fillH = (fillPct / 100) * tankH
  const fillTop = botY - fillH

  const fmtM = (v: number) => `$${(v / 1e6).toFixed(2)}M`
  const diff = pct - objective

  return (
    <div className="bg-white rounded-lg border border-[#E5E7EB] p-5 flex flex-col items-center">
      <div className="text-xs text-gray-400 uppercase tracking-wide font-bold mb-3">{label}</div>

      <svg viewBox="0 0 200 220" className="w-40 h-52">
        {/* Tank body - empty (gray) */}
        <rect x={100 - rx} y={topY} width={rx * 2} height={tankH} fill="#E5E7EB" />

        {/* Tank body - filled (green) */}
        <rect
          x={100 - rx}
          y={fillTop}
          width={rx * 2}
          height={fillH}
          fill="#375623"
          className="transition-all duration-[1200ms] ease-out"
        />

        {/* Bottom ellipse */}
        <ellipse cx={100} cy={botY} rx={rx} ry={ry} fill="#375623" />

        {/* Top ellipse of fill */}
        {fillPct > 0 && fillPct < 100 && (
          <ellipse
            cx={100}
            cy={fillTop}
            rx={rx}
            ry={ry}
            fill="#4a7a2e"
            className="transition-all duration-[1200ms] ease-out"
          />
        )}

        {/* Top cap ellipse (always on top) */}
        <ellipse cx={100} cy={topY} rx={rx} ry={ry} fill="#D1D5DB" stroke="#ccc" strokeWidth={1} />

        {/* Side edges */}
        <line x1={100 - rx} y1={topY} x2={100 - rx} y2={botY} stroke="#ccc" strokeWidth={1} />
        <line x1={100 + rx} y1={topY} x2={100 + rx} y2={botY} stroke="#ccc" strokeWidth={1} />

        {/* Percentage badge */}
        <rect x={68} y={85} width={64} height={28} rx={4} fill="#375623" />
        <text x={100} y={104} textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="Lato, system-ui">
          {pct.toFixed(1)}%
        </text>

        {/* Value */}
        <text x={100} y={200} textAnchor="middle" fill="#111" fontSize="15" fontWeight="bold" fontFamily="Lato, system-ui">
          {fmtM(value)}
        </text>
        <text x={100} y={215} textAnchor="middle" fill="#999" fontSize="10" fontFamily="system-ui">
          de {fmtM(total)}
        </text>
      </svg>

      {/* Diff badge */}
      <div className={`text-sm font-bold mt-1 ${diff >= 0 ? "text-[#375623]" : "text-[#C00000]"}`}>
        Obj: {objective}% · {diff >= 0 ? "+" : ""}{diff.toFixed(1)}%
      </div>
    </div>
  )
}
