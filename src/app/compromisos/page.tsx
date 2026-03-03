"use client"

import { useState, useEffect, useCallback } from "react"
import { PageTabs } from "@/components/page-tabs"
import { PageFooter } from "@/components/page-footer"
import { PeriodFilter } from "@/components/period-filter"
import { getCompromisos, getRankedVendedores, getRankedAseguradoras } from "@/lib/queries"
import type { CompromisoRow } from "@/lib/queries"

function fmt(v: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

function Semaforo({ pct }: { pct: number }) {
  const isGreen = pct >= 90
  const isYellow = pct >= 70 && pct < 90
  const isRed = pct < 70
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className={`w-3.5 h-3.5 rounded-full inline-block border ${isRed ? "bg-[#E62800] border-[#B91C00] shadow-[0_0_4px_#E62800]" : "bg-[#E62800]/15 border-[#E5E7E9]"}`} />
      <span className={`w-3.5 h-3.5 rounded-full inline-block border ${isYellow ? "bg-[#F5C518] border-[#D4A800] shadow-[0_0_4px_#F5C518]" : "bg-[#F5C518]/15 border-[#E5E7E9]"}`} />
      <span className={`w-3.5 h-3.5 rounded-full inline-block border ${isGreen ? "bg-[#2E7D32] border-[#1B5E20] shadow-[0_0_4px_#2E7D32]" : "bg-[#2E7D32]/15 border-[#E5E7E9]"}`} />
    </span>
  )
}

export default function CompromisosPage() {
  const [year, setYear] = useState("2026")
  const [periodos, setPeriodos] = useState<number[]>([2])
  const [data, setData] = useState<CompromisoRow[]>([])
  const [loading, setLoading] = useState(true)

  // Rankings state
  const [topVendedores, setTopVendedores] = useState<{ vendedor: string; primaNeta: number }[]>([])
  const [bottomVendedores, setBottomVendedores] = useState<{ vendedor: string; primaNeta: number }[]>([])
  const [topAseguradoras, setTopAseguradoras] = useState<{ aseguradora: string; primaNeta: number; pct: number }[]>([])

  const handleFilterChange = useCallback((newYear: string, newPeriodos: number[]) => {
    setYear(newYear)
    setPeriodos(newPeriodos)
  }, [])

  useEffect(() => { document.title = "Compromisos | CLK BI Dashboard" }, [])

  const month = periodos[0] ?? 2

  useEffect(() => {
    setLoading(true)
    getCompromisos(Number(year), month).then(r => {
      setData(r ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))

    // Load rankings
    getRankedVendedores(month, year).then(v => {
      if (v && v.length > 0) {
        setTopVendedores(v.slice(0, 5))
        setBottomVendedores(v.slice(-5).reverse())
      }
    })
    getRankedAseguradoras(month, year).then(a => {
      if (a && a.length > 0) {
        const total = a.reduce((s, x) => s + x.primaNeta, 0)
        setTopAseguradoras(a.slice(0, 5).map(x => ({ ...x, pct: total > 0 ? Math.round((x.primaNeta / total) * 1000) / 10 : 0 })))
      }
    })
  }, [year, month])

  const totalMeta = data.reduce((s, r) => s + r.meta, 0)
  const totalActual = data.reduce((s, r) => s + r.primaActual, 0)
  const totalPct = totalMeta > 0 ? Math.round((totalActual / totalMeta) * 1000) / 10 : 0

  const maxAseguradora = topAseguradoras.length > 0 ? Math.max(...topAseguradoras.map(a => a.primaNeta)) : 0

  return (
    <div className="min-h-screen bg-[#FAFAFA] px-3 py-4 flex flex-col">
      <div className="max-w-[1200px] mx-auto w-full flex flex-col flex-1">
      <div className="flex justify-between items-center border-b pb-2 pt-5 w-full">
        <PageTabs />
        <PeriodFilter onFilterChange={handleFilterChange} />
      </div>

      <div className="flex items-center justify-between mb-3 flex-wrap gap-1">
        <h1 className="text-sm font-bold text-[#111] font-lato">Compromisos de Venta</h1>
      </div>

      <div className="bi-card overflow-hidden overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="bg-[#041224] text-white border-b-2 border-b-[#E62800]">
              <th className="text-left px-2 py-2 font-semibold">Vendedor</th>
              <th className="text-right px-2 py-2 font-semibold">Meta comprometida</th>
              <th className="text-right px-2 py-2 font-semibold">Prima neta actual</th>
              <th className="text-right px-2 py-2 font-semibold">% Avance</th>
              <th className="text-center px-2 py-2 font-semibold">Semáforo</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-400">Cargando...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-[#888]">Sin compromisos registrados para este periodo</td></tr>
            ) : data.map((r, idx) => (
              <tr key={r.vendedor} className={`border-b border-[#F0F0F0] hover:bg-[#FFF5F5] ${idx % 2 === 1 ? "bg-[#FAFAFA]" : "bg-white"}`}>
                <td className="px-2 py-1.5 font-medium text-[#111]">{r.vendedor}</td>
                <td className="px-2 py-1.5 text-right text-gray-500">{fmt(r.meta)}</td>
                <td className="px-2 py-1.5 text-right font-medium">{fmt(r.primaActual)}</td>
                <td className={`px-2 py-1.5 text-right font-medium ${r.pctAvance >= 90 ? "text-[#2E7D32]" : r.pctAvance >= 70 ? "text-[#F5C518]" : "text-[#E62800]"}`}>{r.pctAvance}%</td>
                <td className="px-2 py-1.5 text-center"><Semaforo pct={r.pctAvance} /></td>
              </tr>
            ))}
            {!loading && data.length > 0 && (
              <tr className="bg-[#041224] text-white border-t-2">
                <td className="px-2 py-2 font-bold">Total</td>
                <td className="px-2 py-2 text-right font-bold">{fmt(totalMeta)}</td>
                <td className="px-2 py-2 text-right font-bold">{fmt(totalActual)}</td>
                <td className="px-2 py-2 text-right font-bold">{totalPct}%</td>
                <td className="px-2 py-2 text-center"><Semaforo pct={totalPct} /></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Rankings Section */}
      {(topVendedores.length > 0 || topAseguradoras.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {/* Left column: Top 5 + Bottom 5 Vendedores */}
          <div className="flex flex-col gap-4">
            {topVendedores.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-xs font-bold text-[#041224] mb-2">🏆 Top 5 Vendedores</h3>
                <table className="w-full text-[10px]">
                  <thead><tr className="bg-[#041224] text-white border-b-2 border-b-[#E62800]">
                    <th className="px-2 py-1.5 text-left font-semibold w-8">#</th>
                    <th className="px-2 py-1.5 text-left font-semibold">Vendedor</th>
                    <th className="px-2 py-1.5 text-right font-semibold">Prima Neta</th>
                  </tr></thead>
                  <tbody>
                    {topVendedores.map((v, i) => (
                      <tr key={v.vendedor} className="bg-[#F1F8F1] border-b border-[#E5E7E9]">
                        <td className="px-2 py-1 font-bold text-[#2E7D32]">↑ {i + 1}</td>
                        <td className="px-2 py-1">{v.vendedor}</td>
                        <td className="px-2 py-1 text-right font-medium">{fmt(v.primaNeta)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {bottomVendedores.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-xs font-bold text-[#041224] mb-2">⬇️ Bottom 5 Vendedores</h3>
                <table className="w-full text-[10px]">
                  <thead><tr className="bg-[#041224] text-white border-b-2 border-b-[#E62800]">
                    <th className="px-2 py-1.5 text-left font-semibold w-8">#</th>
                    <th className="px-2 py-1.5 text-left font-semibold">Vendedor</th>
                    <th className="px-2 py-1.5 text-right font-semibold">Prima Neta</th>
                  </tr></thead>
                  <tbody>
                    {bottomVendedores.map((v, i) => (
                      <tr key={v.vendedor} className="bg-[#FFF3F3] border-b border-[#E5E7E9]">
                        <td className="px-2 py-1 font-bold text-[#E62800]">↓ {i + 1}</td>
                        <td className="px-2 py-1">{v.vendedor}</td>
                        <td className="px-2 py-1 text-right font-medium">{fmt(v.primaNeta)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right column: Top 5 Aseguradoras + bar chart */}
          {topAseguradoras.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-xs font-bold text-[#041224] mb-2">🏢 Top 5 Aseguradoras</h3>
                <table className="w-full text-[10px]">
                  <thead><tr className="bg-[#041224] text-white border-b-2 border-b-[#E62800]">
                    <th className="px-2 py-1.5 text-left font-semibold w-8">#</th>
                    <th className="px-2 py-1.5 text-left font-semibold">Aseguradora</th>
                    <th className="px-2 py-1.5 text-right font-semibold">Prima Neta</th>
                    <th className="px-2 py-1.5 text-right font-semibold">% del total</th>
                  </tr></thead>
                  <tbody>
                    {topAseguradoras.map((a, i) => (
                      <tr key={a.aseguradora} className={`border-b border-[#E5E7E9] ${i % 2 === 1 ? "bg-[#FAFAFA]" : "bg-white"}`}>
                        <td className="px-2 py-1 font-bold text-[#041224]">{i + 1}</td>
                        <td className="px-2 py-1">{a.aseguradora}</td>
                        <td className="px-2 py-1 text-right font-medium">{fmt(a.primaNeta)}</td>
                        <td className="px-2 py-1 text-right text-[#041224] font-medium">{a.pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-xs font-bold text-[#041224] mb-3">📊 Distribución Aseguradoras</h3>
                <div className="space-y-2">
                  {topAseguradoras.map((a) => (
                    <div key={a.aseguradora} className="flex items-center gap-2">
                      <span className="text-[10px] text-[#333] w-28 truncate shrink-0">{a.aseguradora}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#041224] to-[#E62800] transition-all duration-500"
                          style={{ width: `${maxAseguradora > 0 ? (a.primaNeta / maxAseguradora) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-[#041224] w-10 text-right shrink-0">{a.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <PageFooter />
      </div>
    </div>
  )
}
