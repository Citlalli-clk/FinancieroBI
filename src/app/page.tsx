"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { SEED_LINEAS, SEED_PRESUPUESTO, SEED_FX, getTipoCambio } from "@/lib/queries"
import type { FxRates } from "@/lib/queries"
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

function Gauge({ value, prevYear, budget }: { value: number; prevYear: number; budget: number }) {
  const [anim, setAnim] = useState(0)
  const raf = useRef(0)
  
  // Scale: $100M to $140M like Power BI
  const scaleMin = 100, scaleMax = 140
  const range = scaleMax - scaleMin // 40
  
  // Calculate positions on the gauge (0 to 1)
  const valuePctGauge = Math.max(0.02, Math.min(0.98, (value - scaleMin) / range))
  const pyPctGauge = Math.max(0, Math.min(0.99, (prevYear - scaleMin) / range))
  const budPctGauge = Math.max(0, Math.min(0.99, (budget - scaleMin) / range))

  useEffect(() => {
    const dur = 1200, t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1)
      setAnim(valuePctGauge * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [valuePctGauge])

  const cx = 200, cy = 165, ro = 135, ri = 90
  const startA = 150, sweepA = 240
  const toXY = (deg: number, r: number) => ({ x: cx + r * Math.cos(deg * Math.PI / 180), y: cy + r * Math.sin(deg * Math.PI / 180) })
  const arc = (s: number, e: number, rO: number, rI: number) => {
    const p1 = toXY(s, rO), p2 = toXY(e, rO), p3 = toXY(e, rI), p4 = toXY(s, rI)
    return `M${p1.x},${p1.y} A${rO},${rO} 0 ${e - s > 180 ? 1 : 0} 1 ${p2.x},${p2.y} L${p3.x},${p3.y} A${rI},${rI} 0 ${e - s > 180 ? 1 : 0} 0 ${p4.x},${p4.y} Z`
  }
  const p2a = (p: number) => startA + p * sweepA
  // Zone boundaries: RED = start → prevYear, YELLOW = prevYear → budget, GREEN = budget → end
  // Ensure red zone is always visible (minimum 8% of arc)
  const redPct = Math.max(0.08, pyPctGauge)
  const z1 = p2a(redPct), z2 = p2a(budPctGauge)
  const na = p2a(anim), nRad = na * Math.PI / 180
  const tip = { x: cx + (ro + 10) * Math.cos(nRad), y: cy + (ro + 10) * Math.sin(nRad) }
  const b1 = { x: cx + 7 * Math.cos(nRad + Math.PI/2), y: cy + 7 * Math.sin(nRad + Math.PI/2) }
  const b2 = { x: cx - 7 * Math.cos(nRad + Math.PI/2), y: cy - 7 * Math.sin(nRad + Math.PI/2) }

  // Labels around arc - Scale $100M to $140M
  const labels = [
    { val: 100, pct: 0.01 },
    { val: 105, pct: 5/40 },
    { val: 110, pct: 10/40 },
    { val: 115, pct: 15/40 },
    { val: 120, pct: 20/40 },
    { val: budget, pct: (budget - scaleMin)/range, isBudget: true },
    { val: 130, pct: 30/40 },
    { val: 135, pct: 35/40 },
    { val: 140, pct: 0.99 },
  ]

  return (
    <Link href="/tabla-detalle" className="block">
      <svg viewBox="0 0 400 230" className="w-full">
        <defs>
          <linearGradient id="gaugeRed" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#DC2626"/><stop offset="100%" stopColor="#EF4444"/></linearGradient>
          <linearGradient id="gaugeYellow" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#F59E0B"/><stop offset="100%" stopColor="#FCD34D"/></linearGradient>
          <linearGradient id="gaugeGreen" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#16A34A"/><stop offset="100%" stopColor="#4ADE80"/></linearGradient>
        </defs>
        {/* Background */}
        <path d={arc(startA, startA + sweepA, ro + 3, ri - 3)} fill="#E5E7EB"/>
        {/* RED zone: start to prevYear */}
        <path d={arc(startA, z1, ro, ri)} fill="url(#gaugeRed)"/>
        {/* YELLOW zone: prevYear to budget */}
        <path d={arc(z1, z2, ro, ri)} fill="url(#gaugeYellow)"/>
        {/* GREEN zone: budget to end */}
        <path d={arc(z2, startA + sweepA, ro, ri)} fill="url(#gaugeGreen)"/>
        {/* Scale labels */}
        {labels.map(l => {
          const a = p2a(l.pct)
          const pos = toXY(a, l.isBudget ? ro + 28 : ro + 20)
          return <text key={l.val} x={pos.x} y={pos.y} fontSize={l.isBudget ? 12 : 9} fill={l.isBudget ? "#15803D" : "#4B5563"} textAnchor="middle" dominantBaseline="middle" fontWeight={l.isBudget ? 700 : 500}>{l.isBudget ? `$${l.val.toFixed(1)}M ▼` : `$${l.val.toFixed(1)}M`}</text>
        })}
        {/* Needle */}
        <polygon points={`${tip.x},${tip.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`} fill="#1F2937"/>
        <circle cx={cx} cy={cy} r={14} fill="#374151"/>
        <circle cx={cx} cy={cy} r={7} fill="#6B7280"/>
        {/* Value - centered below arc */}
        <text x={cx} y={cy + 50} fontSize={34} fontWeight={900} fill="#111827" textAnchor="middle">${value.toFixed(1)}M</text>
      </svg>
    </Link>
  )
}

export default function Home() {
  const [year, setYear] = useState("2025")
  const [month, setMonth] = useState("Febrero")
  const [fx, setFx] = useState<FxRates>(SEED_FX)
  const [filter, setFilter] = useState("Grupo Click")
  const [ready, setReady] = useState(false)
  
  // FIXED: Use SEED data only - no Supabase overwrite to prevent flash/glitch
  const lineas = SEED_LINEAS

  useEffect(() => {
    document.title = "Tacómetro | CLK BI Dashboard"
    const timer = setTimeout(() => setReady(true), 500)
    return () => clearTimeout(timer)
  }, [])
  
  // Only fetch tipo de cambio (stable, won't cause visual glitch)
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
        {/* Left side: Filters + Gauge + KPIs + Tipo de Cambio */}
        <div className="w-[calc(50%-8px)] flex flex-col">
          {/* Filtros arriba */}
          <div className="flex gap-1.5 mb-2">
            {["Gobierno", "Grupo Click", "RD"].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-[11px] rounded border ${filter === f ? "bg-white border-gray-400 font-semibold shadow-sm" : "bg-gray-50 border-gray-200 text-gray-600"}`}>{f}</button>
            ))}
          </div>
          
          {/* BLOQUE SUPERIOR - Tacómetro (50% altura) */}
          <div className="h-1/2 flex items-center justify-center border-b pb-4">
            <div className="w-full max-w-[400px]">
              <Gauge value={total / 1e6} prevYear={totalAA / 1e6} budget={totalPpto / 1e6} />
            </div>
          </div>

          {/* BLOQUE INFERIOR - KPIs + Tipo Cambio (50% altura) */}
          <div className="h-1/2 flex flex-col gap-3 pt-4">
            {/* Cumplimiento - beige con borde izquierdo rojo */}
            <div className="bg-[#FDF6EC] rounded border-l-4 border-red-500 p-4">
              <p className="text-sm text-gray-800">Cumplimiento del presupuesto</p>
              <p className="text-3xl font-bold text-gray-900">{cumpl}%</p>
            </div>

            {/* Crecimiento - verde con texto blanco */}
            <div className="bg-[#22c55e] rounded p-4">
              <p className="text-sm text-white/90">Crecimiento vs año anterior</p>
              <p className="text-3xl font-bold text-white flex items-center gap-1">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 6.414l-3.293 3.293a1 1 0 01-1.414 0z" clipRule="evenodd"/></svg>
                {crec}%
              </p>
            </div>

            {/* Tipo de Cambio - ancho completo */}
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

        {/* Right side: Table + Chart — 50/50 vertical split */}
        <div className="w-[calc(50%-8px)] flex flex-col gap-1.5 min-h-0">
          {/* Table */}
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

          {/* Chart — 50/50 with table */}
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
