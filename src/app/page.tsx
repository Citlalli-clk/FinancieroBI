"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { SEED_LINEAS, SEED_PRESUPUESTO } from "@/lib/queries"
// import { getLineasNegocio } from "@/lib/queries" // TODO: Re-enable when Supabase has correct data
import type { LineaRow } from "@/lib/queries"
import { Gauge } from "@/components/gauge"
import { PageTabs } from "@/components/page-tabs"
import { PeriodFilter } from "@/components/period-filter"
// import { DetailDrillTable } from "@/components/detail-drill-table"
import { BarChart, Bar, XAxis, YAxis, LabelList, Tooltip, ResponsiveContainer } from "recharts"

function fmt(v: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

const LINEA_LINKS: Record<string, string> = {
  "Click Franquicias": "/tabla-detalle?linea=click-franquicias",
  "Click Promotoras": "/tabla-detalle?linea=click-promotoras",
  "Corporate": "/tabla-detalle?linea=corporate",
  "Cartera Tradicional": "/tabla-detalle?linea=cartera-tradicional",
  "Call Center": "/tabla-detalle?linea=call-center",
}

export default function Home() {
  const [ready, setReady] = useState(false)
  const [year, setYear] = useState("2026")
  const [periodos, setPeriodos] = useState<number[]>([2])
  const [lineas, setLineas] = useState<LineaRow[]>(SEED_LINEAS)

  const handleFilterChange = useCallback((newYear: string, newPeriodos: number[]) => {
    setYear(newYear)
    setPeriodos(newPeriodos)
  }, [])

  const periodo = periodos[0] ?? 2

  useEffect(() => {
    document.title = "Tacómetro | CLK BI Dashboard"
    const timer = setTimeout(() => setReady(true), 500)
    return () => clearTimeout(timer)
  }, [])

  // TODO: Re-enable when Supabase has correct data
  // useEffect(() => {
  //   let cancelled = false
  //   const load = async () => {
  //     try {
  //       const result = await getLineasNegocio(periodo, year)
  //       if (cancelled || !result || result.length === 0) return
  //       const merged: LineaRow[] = SEED_LINEAS.map(seed => {
  //         const real = result.find(r => r.linea === seed.nombre)
  //         return {
  //           ...seed,
  //           primaNeta: real ? real.primaNeta : seed.primaNeta,
  //         }
  //       })
  //       result.forEach(r => {
  //         if (!merged.find(m => m.nombre === r.linea)) {
  //           merged.push({ nombre: r.linea, primaNeta: r.primaNeta, anioAnterior: 0, presupuesto: 0 })
  //         }
  //       })
  //       setLineas(merged)
  //     } catch {
  //       // Keep current lineas
  //     }
  //   }
  //   load()
  //   return () => { cancelled = true }
  // }, [periodo, year])

  const total = lineas.reduce((s, l) => s + l.primaNeta, 0)
  const totalPpto = lineas.reduce((s, l) => s + l.presupuesto, 0) || SEED_PRESUPUESTO
  const totalAA = lineas.reduce((s, l) => s + l.anioAnterior, 0)
  const cumpl = Math.round((total / totalPpto) * 100)
  const crec = totalAA > 0 ? Math.round(((total - totalAA) / totalAA) * 1000) / 10 : 0

  const chartData = [...lineas].sort((a, b) => a.primaNeta - b.primaNeta).map(l => ({
    name: l.nombre,
    pn: +((l.primaNeta ?? 0) / 1e6).toFixed(1),
    pp: +((l.presupuesto ?? 0) / 1e6).toFixed(1),
  }))

  return (
    <div className="min-h-screen bg-[#FAFAFA] px-3 py-4 flex flex-col">
      <div className="max-w-[1200px] mx-auto w-full flex flex-col flex-1">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-2 pt-3 md:pt-5 w-full gap-2 md:gap-0">
          <PageTabs />
          <PeriodFilter onFilterChange={handleFilterChange} defaultYear="2026" defaultMonth={2} />
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold tracking-wide text-gray-800 mt-6 mb-3 pb-1 border-b border-gray-200">PRIMA NETA COBRADA</h1>

        {/* Main Grid */}
        <div className="flex flex-col md:flex-row gap-3 flex-1 mt-0">
          {/* Left column: Gauge (HERO on mobile — full width, prominent) */}
          <div className="w-full md:w-[55%] flex items-center justify-center">
            <div className="w-full max-w-[400px] md:max-w-none mx-auto">
              <Gauge value={total / 1e6} prevYear={totalAA / 1e6} budget={totalPpto / 1e6} cumplimiento={cumpl} crecimiento={crec} />
            </div>
          </div>

          {/* Right column: Table + Chart */}
          <div className="w-full md:w-[45%] flex flex-col gap-2 md:gap-1 justify-center mt-2 md:mt-6">
            {/* Mobile: compact card list */}
            <div className="md:hidden space-y-1.5">
              {lineas.map((l) => {
                const diff = l.primaNeta - l.presupuesto
                const link = LINEA_LINKS[l.nombre]
                const content = (
                  <div className="bg-white rounded-lg border border-gray-200 px-3 py-2 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm text-gray-900">{l.nombre}</span>
                      <span className={`text-xs font-bold ${diff < 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {diff < 0 ? `(${fmt(Math.abs(diff))})` : `+${fmt(diff)}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>PN: <strong className="text-gray-900">{fmt(l.primaNeta)}</strong></span>
                      <span>Ppto: {fmt(l.presupuesto)}</span>
                    </div>
                  </div>
                )
                return link ? <Link key={l.nombre} href={link}>{content}</Link> : <div key={l.nombre}>{content}</div>
              })}
              <div className="bg-gray-600 rounded-lg px-3 py-2 flex justify-between items-center">
                <span className="font-bold text-sm text-white">Total</span>
                <span className="font-bold text-sm text-white">{fmt(total)}</span>
              </div>
            </div>

            {/* Desktop: full table */}
            <div className="hidden md:block bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#6B7280' }}>
                    <th className="text-left px-1.5 py-0.5 text-[13px] font-bold text-white">Línea</th>
                    <th className="text-right px-1.5 py-0.5 text-[13px] font-bold text-white">Prima Neta</th>
                    <th className="text-right px-1.5 py-0.5 text-[13px] font-bold text-white">Año Ant. *</th>
                    <th className="text-right px-1.5 py-0.5 text-[13px] font-bold text-white">Presupuesto</th>
                    <th className="text-right px-1.5 py-0.5 text-[13px] font-bold text-white">Diferencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lineas.map((l, i) => {
                    const diff = l.primaNeta - l.presupuesto
                    const link = LINEA_LINKS[l.nombre]
                    return (
                      <tr key={l.nombre} className={`cursor-pointer transition-colors hover:bg-blue-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/70"}`}>
                        <td className="px-1.5 py-0.5 font-medium text-gray-900">
                          {link ? <Link href={link} className="hover:underline text-gray-900">{l.nombre}</Link> : l.nombre}
                        </td>
                        <td className="px-1.5 py-0.5 text-right font-semibold text-gray-900">{fmt(l.primaNeta)}</td>
                        <td className="px-1.5 py-0.5 text-right text-gray-500">{fmt(l.anioAnterior)}</td>
                        <td className="px-1.5 py-0.5 text-right font-semibold" style={{ color: '#374151' }}>{fmt(l.presupuesto)}</td>
                        <td className={`px-1.5 py-1 text-right font-semibold ${diff < 0 ? "text-red-600" : "text-emerald-600"}`}>
                          {diff < 0 ? `(${fmt(Math.abs(diff))})` : fmt(diff)}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="font-bold border-t-2 border-gray-300" style={{ backgroundColor: '#6B7280', color: '#fff' }}>
                    <td className="px-1.5 py-0.5" style={{ color: '#fff' }}>Total</td>
                    <td className="px-1.5 py-0.5 text-right" style={{ color: '#fff' }}>{fmt(total)}</td>
                    <td className="px-1.5 py-0.5 text-right" style={{ color: '#fff' }}>{fmt(totalAA)}</td>
                    <td className="px-1.5 py-0.5 text-right" style={{ color: '#fff' }}>{fmt(totalPpto)}</td>
                    <td className={`px-1.5 py-1 text-right font-bold`} style={{ color: (total - totalPpto) < 0 ? '#ff6b6b' : '#4ade80' }}>
                      {(total - totalPpto) < 0 ? `(${fmt(Math.abs(total - totalPpto))})` : fmt(total - totalPpto)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Chart */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-2 py-1.5 flex flex-col h-[260px] md:h-[280px] overflow-hidden">
              <div className="flex gap-2 md:gap-3 text-[10px] md:text-[12px] mb-1 self-start">
                <div className="flex items-center gap-1"><span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-sm" style={{ backgroundColor: '#3983F6' }}/><span className="text-gray-700 font-medium">Prima neta efectuada</span></div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-sm" style={{ backgroundColor: '#9CA3AF' }}/><span className="text-gray-700 font-medium">Presupuesto</span></div>
              </div>
              <div className="w-full flex-1">
                {ready && chartData.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={chartData} margin={{ top: 2, right: 45, left: 5, bottom: 2 }} barGap={8}>
                      <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={v => `$${v}M`} tick={{ fontSize: 10 }} axisLine={{ stroke: '#E5E7EB' }}/>
                      <YAxis type="category" dataKey="name" width={85} tick={{ fontSize: 10 }} axisLine={false} tickLine={false}/>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#052F5F', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', fontSize: 12, padding: '8px 12px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#ccc', fontWeight: 600, marginBottom: 4 }}
                        formatter={(value?: number, name?: string) => [`$${value ?? 0}M`, name === 'pn' ? 'Prima Neta' : 'Presupuesto']}
                        cursor={{ fill: 'rgba(57,131,246,0.08)' }}
                      />
                      <Bar dataKey="pn" fill="#3983F6" radius={[0, 3, 3, 0]} barSize={12} isAnimationActive={true} animationDuration={800}>
                        <LabelList dataKey="pn" position="right" formatter={(v: unknown) => v != null ? `$${v}M` : ''} style={{ fontSize: 10, fill: '#3983F6', fontWeight: 600 }}/>
                      </Bar>
                      <Bar dataKey="pp" fill="#9CA3AF" radius={[0, 3, 3, 0]} barSize={12} isAnimationActive={true} animationDuration={800}>
                        <LabelList dataKey="pp" position="right" formatter={(v: unknown) => v != null ? `$${v}M` : ''} style={{ fontSize: 10, fill: '#6B7280', fontWeight: 600 }}/>
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
