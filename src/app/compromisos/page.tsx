"use client"

import { useState, useEffect, useCallback } from "react"
import { PageTabs } from "@/components/page-tabs"
import { PeriodFilter } from "@/components/period-filter"
import { getCompromisos, getRankedVendedores } from "@/lib/queries"
import type { CompromisoRow } from "@/lib/queries"
import { BarChart, Bar, XAxis, LabelList, Cell, ResponsiveContainer } from "recharts"

function fmt(v: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}
function fmtShort(v: number) {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`
  return `$${v}`
}
function surname(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts.length >= 3 ? parts[parts.length - 2] : parts[parts.length - 1] || name
}
function semaforoColor(pct: number) {
  if (pct >= 90) return "#2E7D32"
  if (pct >= 70) return "#F5C518"
  return "#E62800"
}
function Semaforo({ pct }: { pct: number }) {
  const isGreen = pct >= 90, isYellow = pct >= 70 && pct < 90, isRed = pct < 70
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className={`w-2 h-2 rounded-full inline-block border ${isRed ? "bg-[#E62800] border-[#B91C00]" : "bg-[#E62800]/15 border-[#E5E7E9]"}`} />
      <span className={`w-2 h-2 rounded-full inline-block border ${isYellow ? "bg-[#F5C518] border-[#D4A800]" : "bg-[#F5C518]/15 border-[#E5E7E9]"}`} />
      <span className={`w-2 h-2 rounded-full inline-block border ${isGreen ? "bg-[#2E7D32] border-[#1B5E20]" : "bg-[#2E7D32]/15 border-[#E5E7E9]"}`} />
    </span>
  )
}

/* Mini bar chart rendered as pure divs — no Recharts overhead, pixel-perfect control */
function MiniBarChart({ data, color, colorFn }: { data: { name: string; value: number; pct?: number }[]; color?: string; colorFn?: (pct: number) => string }) {
  if (!data.length) return null
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-[3px] h-full px-1 pb-3 pt-1">
      {data.map((d, i) => {
        const pct = Math.max((d.value / max) * 100, 4)
        const fill = colorFn && d.pct != null ? colorFn(d.pct) : color || "#333"
        return (
          <div key={i} className="flex flex-col items-center flex-1 min-w-0" style={{ height: '100%', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 6, color: '#555', fontWeight: 600, marginBottom: 1, whiteSpace: 'nowrap' }}>{fmtShort(d.value)}</span>
            <div style={{ width: '100%', maxWidth: 24, height: `${pct}%`, minHeight: 3, background: fill, borderRadius: '2px 2px 0 0' }} />
            <span style={{ fontSize: 5, color: '#888', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 40 }}>{d.name}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function CompromisosPage() {
  const [year, setYear] = useState("2026")
  const [periodos, setPeriodos] = useState<number[]>([2])
  const [data, setData] = useState<CompromisoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [topVendedores, setTopVendedores] = useState<{ vendedor: string; primaNeta: number }[]>([])
  const [bottomVendedores, setBottomVendedores] = useState<{ vendedor: string; primaNeta: number }[]>([])

  const handleFilterChange = useCallback((newYear: string, newPeriodos: number[]) => { setYear(newYear); setPeriodos(newPeriodos) }, [])

  useEffect(() => { document.title = "Vendedores | CLK BI Dashboard" }, [])

  const month = periodos[0] ?? 2

  useEffect(() => {
    setLoading(true)
    getCompromisos(Number(year), month).then(r => { setData(r ?? []); setLoading(false) }).catch(() => setLoading(false))
    getRankedVendedores(month, year).then(v => {
      if (v && v.length > 0) { setTopVendedores(v.slice(0, 5)); setBottomVendedores(v.slice(-5).reverse()) }
    })
  }, [year, month])

  const totalMeta = data.reduce((s, r) => s + r.meta, 0)
  const totalActual = data.reduce((s, r) => s + r.primaActual, 0)
  const totalPct = totalMeta > 0 ? Math.round((totalActual / totalMeta) * 1000) / 10 : 0

  const barData = data.map(r => ({ name: surname(r.vendedor), value: r.primaActual, pct: r.pctAvance }))
  const topBarData = topVendedores.map(v => ({ name: surname(v.vendedor), value: v.primaNeta }))
  const bottomBarData = bottomVendedores.map(v => ({ name: surname(v.vendedor), value: v.primaNeta }))

  const cellStyle = "px-1.5 py-[1px]"
  const hdrStyle = "px-1.5 py-[2px]"

  return (
    <div className="min-h-screen bg-[#FAFAFA] px-3 py-4 flex flex-col">
      <div className="max-w-[1200px] mx-auto w-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-2 pt-5 w-full">
          <PageTabs />
          <PeriodFilter onFilterChange={handleFilterChange} />
        </div>

        <h1 className="text-sm font-bold text-[#111] font-lato mt-3 mb-2">Vendedores — Compromisos</h1>

        {/* ROW 1: Compromisos table + chart */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
            <table className="w-full border-collapse" style={{ fontSize: 9, lineHeight: 1.3 }}>
              <thead>
                <tr className="bg-[#041224] text-white border-b-2 border-b-[#E62800]">
                  <th className={`${hdrStyle} text-left`} style={{ fontSize: 9 }}>Vendedor</th>
                  <th className={`${hdrStyle} text-right`} style={{ fontSize: 9 }}>Meta</th>
                  <th className={`${hdrStyle} text-right`} style={{ fontSize: 9 }}>Prima Neta</th>
                  <th className={`${hdrStyle} text-right`} style={{ fontSize: 9 }}>%</th>
                  <th className={`${hdrStyle} text-center`} style={{ fontSize: 9 }}>Sem.</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-1 py-2 text-center text-gray-400" style={{ fontSize: 9 }}>Cargando...</td></tr>
                ) : data.slice(0, 10).map((r, idx) => (
                  <tr key={r.vendedor} className={`border-b border-[#F0F0F0] ${idx % 2 === 1 ? "bg-[#FAFAFA]" : ""}`}>
                    <td className={`${cellStyle} font-medium text-[#111]`}>{r.vendedor}</td>
                    <td className={`${cellStyle} text-right text-gray-500`}>{fmt(r.meta)}</td>
                    <td className={`${cellStyle} text-right font-medium`}>{fmt(r.primaActual)}</td>
                    <td className={`${cellStyle} text-right font-medium`} style={{ color: semaforoColor(r.pctAvance) }}>{r.pctAvance}%</td>
                    <td className={`${cellStyle} text-center`}><Semaforo pct={r.pctAvance} /></td>
                  </tr>
                ))}
                {!loading && data.length > 0 && (
                  <tr className="bg-[#041224] text-white">
                    <td className={`${cellStyle} font-bold`}>Total</td>
                    <td className={`${cellStyle} text-right font-bold`}>{fmt(totalMeta)}</td>
                    <td className={`${cellStyle} text-right font-bold`}>{fmt(totalActual)}</td>
                    <td className={`${cellStyle} text-right font-bold`}>{totalPct}%</td>
                    <td className={`${cellStyle} text-center`}><Semaforo pct={totalPct} /></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Chart card - height matches table naturally */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2" style={{ height: 220 }}>
            <MiniBarChart data={barData} colorFn={semaforoColor} />
          </div>
        </div>

        {/* ROW 2: Top 5 + Bottom 5 side by side, each with its chart */}
        <div className="grid grid-cols-2 gap-2">
          {/* Top 5 block */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
            <p className="text-[10px] font-bold text-[#041224] mb-1">🏆 Top 5 Vendedores</p>
            <div className="grid grid-cols-2 gap-2">
              <table className="w-full border-collapse" style={{ fontSize: 8, lineHeight: 1.3 }}>
                <thead>
                  <tr className="bg-[#041224] text-white border-b-2 border-b-[#2E7D32]">
                    <th className={`${hdrStyle} text-left w-4`} style={{ fontSize: 8 }}>#</th>
                    <th className={`${hdrStyle} text-left`} style={{ fontSize: 8 }}>Vendedor</th>
                    <th className={`${hdrStyle} text-right`} style={{ fontSize: 8 }}>Prima Neta</th>
                  </tr>
                </thead>
                <tbody>
                  {topVendedores.map((v, i) => (
                    <tr key={v.vendedor} className={`border-b border-[#E5E7E9] ${i % 2 === 1 ? "bg-[#FAFAFA]" : ""}`}>
                      <td className={`${cellStyle} font-bold text-[#2E7D32]`}>{i + 1}</td>
                      <td className={`${cellStyle}`}>{v.vendedor}</td>
                      <td className={`${cellStyle} text-right font-medium`}>{fmt(v.primaNeta)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ height: 100 }}>
                <MiniBarChart data={topBarData} color="#2E7D32" />
              </div>
            </div>
          </div>

          {/* Bottom 5 block */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
            <p className="text-[10px] font-bold text-[#041224] mb-1">⬇️ Bottom 5 Vendedores</p>
            <div className="grid grid-cols-2 gap-2">
              <table className="w-full border-collapse" style={{ fontSize: 8, lineHeight: 1.3 }}>
                <thead>
                  <tr className="bg-[#041224] text-white border-b-2 border-b-[#E62800]">
                    <th className={`${hdrStyle} text-left w-4`} style={{ fontSize: 8 }}>#</th>
                    <th className={`${hdrStyle} text-left`} style={{ fontSize: 8 }}>Vendedor</th>
                    <th className={`${hdrStyle} text-right`} style={{ fontSize: 8 }}>Prima Neta</th>
                  </tr>
                </thead>
                <tbody>
                  {bottomVendedores.map((v, i) => (
                    <tr key={v.vendedor} className={`border-b border-[#E5E7E9] ${i % 2 === 1 ? "bg-[#FAFAFA]" : ""}`}>
                      <td className={`${cellStyle} font-bold text-[#E62800]`}>{i + 1}</td>
                      <td className={`${cellStyle}`}>{v.vendedor}</td>
                      <td className={`${cellStyle} text-right font-medium`}>{fmt(v.primaNeta)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ height: 100 }}>
                <MiniBarChart data={bottomBarData} color="#E62800" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
