"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { SEED_LINEAS, SEED_PRESUPUESTO, SEED_FX, getTipoCambio } from "@/lib/queries"
import type { FxRates } from "@/lib/queries"
import { Gauge } from "@/components/gauge"
import { BarChart, Bar, XAxis, YAxis, LabelList, Tooltip } from "recharts"

function fmt(v: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

const TABS = [
  { href: "/", label: "Tacómetro" },
  { href: "/tabla-detalle", label: "Tabla detalle" },
  { href: "/compromisos", label: "Compromisos 2024" },
  { href: "/internacional", label: "Internacional" },
  { href: "/corporate", label: "Corporate." },
  { href: "/cobranza", label: "Convenios." },
]

function Tabs() {
  const pathname = usePathname()
  return (
    <div className="flex items-center">
      {TABS.map((tab, i) => (
        <React.Fragment key={tab.href}>
          {i > 0 && <span className="text-gray-300 mx-2">|</span>}
          <Link href={tab.href} className={`text-[14px] ${pathname === tab.href ? "text-gray-900 font-bold" : "text-gray-500 hover:text-gray-700"}`}>
            {tab.label}
          </Link>
        </React.Fragment>
      ))}
    </div>
  )
}

export default function Home() {
  const [year, setYear] = useState("2025")
  const [month, setMonth] = useState("Febrero")
  const [fx, setFx] = useState<FxRates>(SEED_FX)
  const [ready, setReady] = useState(false)

  const lineas = SEED_LINEAS

  useEffect(() => {
    document.title = "Tacómetro | CLK BI Dashboard"
    const timer = setTimeout(() => setReady(true), 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => { getTipoCambio().then(r => r && setFx(r)) }, [])

  const total = lineas.reduce((s, l) => s + l.primaNeta, 0)
  const totalPpto = lineas.reduce((s, l) => s + l.presupuesto, 0) || SEED_PRESUPUESTO
  const totalAA = lineas.reduce((s, l) => s + l.anioAnterior, 0)
  const cumpl = Math.round((total / totalPpto) * 100)
  const crec = Math.round(((total - totalAA) / totalAA) * 1000) / 10

  const chartData = [...lineas].sort((a, b) => a.primaNeta - b.primaNeta).map(l => ({
    name: l.nombre.replace('Click ', '').replace('Cartera ', ''),
    pn: +((l.primaNeta ?? 0) / 1e6).toFixed(1),
    pp: +((l.presupuesto ?? 0) / 1e6).toFixed(1),
  }))

  return (
    <div className="min-h-screen bg-[#FAFAFA] px-4 py-3 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-2 mb-2">
        <Tabs />
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Año</span>
          <select id="year" name="year" value={year} onChange={e => setYear(e.target.value)} className="border rounded px-2 py-1 text-sm">{["2025","2026"].map(y => <option key={y}>{y}</option>)}</select>
          <span className="text-sm text-gray-500">Mes</span>
          <select id="month" name="month" value={month} onChange={e => setMonth(e.target.value)} className="border rounded px-2 py-1 text-sm">{["Febrero","Enero","Marzo"].map(m => <option key={m}>{m}</option>)}</select>
          <button className="p-1.5 hover:bg-gray-100 rounded"><svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg></button>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-xl font-bold text-gray-800 mb-2">Prima neta cobrada por línea de negocio</h1>

      {/* Main Grid */}
      <div className="flex gap-3 justify-between flex-1 overflow-hidden">
        {/* Left side: Gauge + KPIs + Tipo de Cambio */}
        <div className="w-[calc(50%-8px)] flex flex-col">
          {/* BLOQUE SUPERIOR - Tacómetro */}
          <div className="flex items-center justify-center border-b pb-2">
            <div className="w-full max-w-[380px]">
              <Gauge value={total / 1e6} prevYear={totalAA / 1e6} budget={totalPpto / 1e6} />
            </div>
          </div>

          {/* BLOQUE INFERIOR - KPIs + Tipo Cambio */}
          <div className="flex flex-col gap-3 pt-3 flex-1">
            <div className="bg-[#FDF6EC] rounded border-l-4 border-red-500 p-4">
              <p className="text-sm text-gray-800">Cumplimiento del presupuesto</p>
              <p className="text-3xl font-bold text-gray-900">{cumpl}%</p>
            </div>

            <div className="bg-[#22c55e] rounded p-4">
              <p className="text-sm text-white/90">Crecimiento vs año anterior</p>
              <p className="text-3xl font-bold text-white flex items-center gap-1">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 6.414l-3.293 3.293a1 1 0 01-1.414 0z" clipRule="evenodd"/></svg>
                {crec}%
              </p>
            </div>

            <div className="mt-auto">
              <div className="bg-white border rounded shadow-sm w-full">
                <div className="bg-gray-800 text-white text-[12px] font-bold px-4 py-2 text-center">Tipo de cambio</div>
                <div className="px-4 py-3 text-sm flex justify-around">
                  <div className="text-center"><span className="text-blue-600 font-medium block">Dólar</span><span className="font-bold text-lg">${fx.usd.toFixed(2)}</span></div>
                  <div className="text-center border-l pl-4"><span className="text-gray-500 block">Peso Dom.</span><span className="font-bold text-lg">${fx.dop.toFixed(2)}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Table + Chart */}
        <div className="w-[calc(50%-8px)] flex flex-col gap-1.5 min-h-0">
          <div className="flex-1 bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden flex flex-col">
            <table className="w-full h-full text-[12px]">
              <thead className="bg-[#041224] text-white">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold tracking-wide">Línea</th>
                  <th className="text-right px-3 py-2 font-semibold tracking-wide">Prima Neta</th>
                  <th className="text-right px-3 py-2 font-semibold tracking-wide">Año Anterior *</th>
                  <th className="text-right px-3 py-2 font-semibold tracking-wide">Presupuesto</th>
                  <th className="text-right px-3 py-2 font-semibold tracking-wide">Diferencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lineas.map((l, i) => {
                  const diff = l.primaNeta - l.presupuesto
                  return (
                    <tr key={l.nombre} className={`cursor-pointer transition-colors hover:bg-blue-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                      <td className="px-3 py-1.5 font-medium text-gray-800">{l.nombre}</td>
                      <td className="px-3 py-1.5 text-right font-semibold text-gray-900">{fmt(l.primaNeta)}</td>
                      <td className="px-3 py-1.5 text-right text-gray-500">{fmt(l.anioAnterior)}</td>
                      <td className="px-3 py-1.5 text-right text-gray-500">{fmt(l.presupuesto)}</td>
                      <td className={`px-3 py-1.5 text-right font-semibold ${diff < 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {diff < 0 ? `(${fmt(Math.abs(diff))})` : fmt(diff)}
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                  <td className="px-3 py-2 text-gray-900">Total</td>
                  <td className="px-3 py-2 text-right text-gray-900">{fmt(total)}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{fmt(totalAA)}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{fmt(totalPpto)}</td>
                  <td className={`px-3 py-2 text-right font-bold ${(total - totalPpto) < 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {(total - totalPpto) < 0 ? `(${fmt(Math.abs(total - totalPpto))})` : fmt(total - totalPpto)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Chart */}
          <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 flex flex-col min-h-0">
            <div className="flex gap-4 text-[11px] mb-1.5">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#1e3a5f] rounded-sm"/><span className="text-gray-700 font-medium">PN Efectuada</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#94a3b8] rounded-sm"/><span className="text-gray-700 font-medium">Presupuesto</span></div>
            </div>
            <div className="w-full">
              {ready && chartData.length > 0 && (
                  <BarChart width={520} height={280} layout="vertical" data={chartData} margin={{ top: 2, right: 50, left: 5, bottom: 2 }} barGap={2}>
                    <XAxis type="number" domain={[0, 80]} ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80]} tickFormatter={v => `$${v}M`} tick={{ fontSize: 10 }} axisLine={{ stroke: '#E5E7EB' }}/>
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} axisLine={false} tickLine={false}/>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value?: number) => [`$${value ?? 0}M`, '']}
                    />
                    <Bar dataKey="pn" fill="#1e3a5f" radius={[0, 3, 3, 0]} barSize={24} isAnimationActive={true} animationDuration={800}>
                      <LabelList dataKey="pn" position="right" formatter={(v: unknown) => v != null ? `$${v}M` : ''} style={{ fontSize: 10, fill: '#1e3a5f', fontWeight: 600 }}/>
                    </Bar>
                    <Bar dataKey="pp" fill="#94a3b8" radius={[0, 3, 3, 0]} barSize={24} isAnimationActive={true} animationDuration={800}>
                      <LabelList dataKey="pp" position="right" formatter={(v: unknown) => v != null ? `$${v}M` : ''} style={{ fontSize: 10, fill: '#64748b' }}/>
                    </Bar>
                  </BarChart>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-2 pt-2 border-t">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 text-white text-[9px] font-black px-2 py-1 rounded leading-tight">INTRA<br/>CLICK</div>
          <span className="text-xs text-gray-500">* El total de la prima neta del año anterior está al corte del día: 23/febrero/2025</span>
        </div>
        <div className="text-right text-xs text-gray-600">
          <div className="font-semibold">Fecha de actualización.</div>
          <div>23/02/2026 08:10:20 a.m.</div>
        </div>
      </div>
    </div>
  )
}
