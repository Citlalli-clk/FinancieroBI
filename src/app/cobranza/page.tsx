"use client"

import { useEffect } from "react"
import { PageTabs } from "@/components/page-tabs"
import { PageFooter } from "@/components/page-footer"
import { Cylinder } from "@/components/cylinder"

function fmt(v: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(v)
}

// ── Donut Chart ──
function DonutChart({ value, objetivo, color, size = 120 }: { value: number; objetivo: number; color: string; size?: number }) {
  const radius = size * 0.38
  const circ = 2 * Math.PI * radius
  const filled = (value / 100) * circ
  const objAngle = (objetivo / 100) * 360 - 90
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size, margin: "0 auto" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E7E9" strokeWidth={size * 0.12} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color}
          strokeWidth={size * 0.12} strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-all duration-1000" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E62800"
          strokeWidth={2} strokeDasharray={`3 ${circ - 3}`}
          transform={`rotate(${objAngle} ${size / 2} ${size / 2})`} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-black text-[#041224]" style={{ fontSize: size * 0.18 }}>{value}%</span>
        <span className="text-[#CCD1D3]" style={{ fontSize: size * 0.1 }}>Obj: {objetivo}%</span>
      </div>
    </div>
  )
}

// ── Seed Data ──
const RAMOS = [
  { nombre: "Vehículos", pnEfectuada: 787742854, polizas: 160499 },
  { nombre: "Acc. y Enf.", pnEfectuada: 276612477, polizas: 10476 },
  { nombre: "Daños", pnEfectuada: 144378444, polizas: 6455 },
  { nombre: "Vida", pnEfectuada: 59636744, polizas: 4202 },
  { nombre: "Otros", pnEfectuada: 8013999, polizas: 545 },
]
const TOTAL_PN = RAMOS.reduce((s, r) => s + r.pnEfectuada, 0)
const TOTAL_POL = RAMOS.reduce((s, r) => s + r.polizas, 0)

const RAMO_COLORS = ["#E62800", "#041224", "#CCD1D3", "#6B7280", "#E5E7E9"]

const COMPANIES = [
  { nombre: "AFIRME", primaNeta: 15109066, convenio: 15000000, pnAA: 9836221, pendiente: 44534, pnCia: 5677131, difCia: 9430936 },
  { nombre: "AIG", primaNeta: 8200000, convenio: 9500000, pnAA: 7100000, pendiente: 120000, pnCia: 3200000, difCia: 5000000 },
  { nombre: "ATLAS", primaNeta: 5400000, convenio: 6200000, pnAA: 4800000, pendiente: 85000, pnCia: 2100000, difCia: 3300000 },
  { nombre: "AXA", primaNeta: 42000000, convenio: 45000000, pnAA: 38500000, pendiente: 350000, pnCia: 18000000, difCia: 24000000 },
  { nombre: "CHUBB", primaNeta: 28500000, convenio: 30000000, pnAA: 25000000, pendiente: 200000, pnCia: 12000000, difCia: 16500000 },
  { nombre: "GNP", primaNeta: 95000000, convenio: 98000000, pnAA: 82000000, pendiente: 500000, pnCia: 40000000, difCia: 55000000 },
  { nombre: "HDI", primaNeta: 18000000, convenio: 20000000, pnAA: 16000000, pendiente: 150000, pnCia: 7500000, difCia: 10500000 },
  { nombre: "MAPFRE", primaNeta: 12000000, convenio: 13000000, pnAA: 10500000, pendiente: 95000, pnCia: 5000000, difCia: 7000000 },
  { nombre: "QUÁLITAS", primaNeta: 185000000, convenio: 180000000, pnAA: 160000000, pendiente: 800000, pnCia: 80000000, difCia: 105000000 },
  { nombre: "ZURICH", primaNeta: 22000000, convenio: 24000000, pnAA: 19000000, pendiente: 180000, pnCia: 9000000, difCia: 13000000 },
]

function pct(val: number, base: number) {
  if (!base) return 0
  return ((val - base) / Math.abs(base)) * 100
}

function PctBadge({ val, base }: { val: number; base: number }) {
  const p = pct(val, base)
  const neg = p < 0
  return (
    <td className="px-2 py-2 text-right">
      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${neg ? "bg-[#FEE2E2] text-[#991B1B]" : "bg-[#DCFCE7] text-[#166534]"}`}>
        {neg ? "" : "+"}{p.toFixed(1)}%
      </span>
    </td>
  )
}

export default function CobranzaPage() {
  useEffect(() => { document.title = "Aseguradoras | CLK BI Dashboard" }, [])

  const compTotals = COMPANIES.reduce((a, c) => ({
    primaNeta: a.primaNeta + c.primaNeta, convenio: a.convenio + c.convenio,
    pnAA: a.pnAA + c.pnAA, pendiente: a.pendiente + c.pendiente,
    pnCia: a.pnCia + c.pnCia, difCia: a.difCia + c.difCia,
  }), { primaNeta: 0, convenio: 0, pnAA: 0, pendiente: 0, pnCia: 0, difCia: 0 })

  return (
    <div>
      <PageTabs />

      {/* Title + simplified filters */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-[#041224]">Aseguradoras</h1>
        <div className="flex items-center gap-2 text-xs">
          <select id="cob-year" name="cob-year" className="border border-[#E5E7E9] rounded px-2.5 py-1.5 bg-white text-[#041224]"><option>2026</option><option>2025</option></select>
          <select id="cob-month" name="cob-month" className="border border-[#E5E7E9] rounded px-2.5 py-1.5 bg-white text-[#041224]">
            <option>Enero</option><option>Febrero</option><option>Marzo</option><option>Abril</option>
            <option>Mayo</option><option>Junio</option><option>Julio</option><option>Agosto</option>
            <option>Septiembre</option><option>Octubre</option><option>Noviembre</option><option>Diciembre</option>
          </select>
          <select id="cob-linea" name="cob-linea" className="border border-[#E5E7E9] rounded px-2.5 py-1.5 bg-white text-[#041224]"><option>Línea de negocio</option></select>
          <select id="cob-ramo" name="cob-ramo" className="border border-[#E5E7E9] rounded px-2.5 py-1.5 bg-white text-[#041224]"><option>Ramo</option></select>
          <span className="text-xs text-[#CCD1D3] ml-2">Actualizado: 27/02/2026</span>
        </div>
      </div>

      {/* 3 Metric cards — equal height */}
      <div className="grid grid-cols-3 gap-3 mb-5" style={{ minHeight: 280 }}>
        {/* Card 1 — Meta convenio */}
        <div className="bg-white rounded-lg shadow-sm p-5 border border-[#E5E7E9] flex flex-col">
          <p className="text-[#CCD1D3] text-[10px] font-bold uppercase tracking-wider mb-3">Meta convenio</p>
          <DonutChart value={94.5} objetivo={90} color="#E62800" size={130} />
          <div className="mt-3 space-y-1">
            <p className="text-[#E62800] text-sm font-bold">+6.40% vs 2025</p>
            <div className="flex justify-between text-xs text-[#041224]">
              <span>PN efectuada mensual</span><strong>$1,300M</strong>
            </div>
            <div className="flex justify-between text-xs text-[#041224]">
              <span>Convenio mensual</span><strong>$1,400M</strong>
            </div>
          </div>
        </div>

        {/* Card 2 — Acumulado */}
        <div className="bg-white rounded-lg shadow-sm p-5 border border-[#E5E7E9] flex flex-col">
          <p className="text-[#CCD1D3] text-[10px] font-bold uppercase tracking-wider mb-3">Acumulado</p>
          <DonutChart value={94.5} objetivo={90} color="#041224" size={130} />
          <div className="mt-3 space-y-1">
            <p className="text-[#E62800] text-sm font-bold">+5.05% vs 2025</p>
            <div className="flex justify-between text-xs text-[#041224]">
              <span>Acumulado PN</span><strong>1,276.4 mill.</strong>
            </div>
            <div className="flex justify-between text-xs text-[#041224]">
              <span>Convenio acumulado</span><strong>$1,400M</strong>
            </div>
          </div>
        </div>

        {/* Card 3 — Meta anual con cilindro */}
        <div className="bg-white rounded-lg shadow-sm p-5 border border-[#E5E7E9] flex flex-col items-center">
          <p className="text-[#CCD1D3] text-[10px] font-bold uppercase tracking-wider mb-2 self-start">Meta anual</p>
          <p className="text-[#E62800] text-lg font-black mb-1">↑ 94.7%</p>
          <Cylinder value={1292820000} maxValue={2585640000} pct={94.7} objective={90} />
          <div className="mt-3 grid grid-cols-2 gap-x-4 text-center w-full">
            <div>
              <div className="text-[9px] text-[#CCD1D3] uppercase font-bold">PN efectuada anual</div>
              <div className="text-xs font-bold text-[#041224]">1,276.4 mill.</div>
            </div>
            <div>
              <div className="text-[9px] text-[#CCD1D3] uppercase font-bold">Convenio anual</div>
              <div className="text-xs font-bold text-[#041224]">$1,348.0 mill.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen por ramo */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#041224] border-b-2 border-b-[#E62800]">
              <th className="text-left px-3 py-2 font-semibold text-white text-xs">Resumen por ramo</th>
              {RAMOS.map(r => <th key={r.nombre} className="text-right px-3 py-2 font-semibold text-white text-xs">{r.nombre}</th>)}
              <th className="text-right px-3 py-2 font-semibold text-white text-xs">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#E5E7E9] hover:bg-[#FFF5F5] transition-colors">
              <td className="px-3 py-2 text-xs font-medium text-[#041224]">PN efectuada</td>
              {RAMOS.map(r => <td key={r.nombre} className="px-3 py-2 text-right text-xs font-medium">{fmt(r.pnEfectuada)}</td>)}
              <td className="px-3 py-2 text-right text-xs font-bold">{fmt(TOTAL_PN)}</td>
            </tr>
            <tr className="border-b border-[#E5E7E9] bg-[#F9F9F9] hover:bg-[#FFF5F5] transition-colors">
              <td className="px-3 py-2 text-xs font-medium text-[#041224]">% PN efectuada</td>
              {RAMOS.map(r => <td key={r.nombre} className="px-3 py-2 text-right text-xs text-[#6B7280]">{((r.pnEfectuada / TOTAL_PN) * 100).toFixed(2)}%</td>)}
              <td className="px-3 py-2 text-right text-xs font-bold">100%</td>
            </tr>
            <tr className="hover:bg-[#FFF5F5] transition-colors">
              <td className="px-3 py-2 text-xs font-medium text-[#041224]">No. pólizas</td>
              {RAMOS.map(r => <td key={r.nombre} className="px-3 py-2 text-right text-xs font-medium">{new Intl.NumberFormat("es-MX").format(r.polizas)}</td>)}
              <td className="px-3 py-2 text-right text-xs font-bold">{new Intl.NumberFormat("es-MX").format(TOTAL_POL)}</td>
            </tr>
            {/* TOTAL row */}
            <tr className="bg-[#041224] text-white">
              <td className="px-3 py-2.5 text-xs font-bold">Total</td>
              {RAMOS.map(r => <td key={r.nombre} className="px-3 py-2.5 text-right text-xs font-bold">{fmt(r.pnEfectuada)}</td>)}
              <td className="px-3 py-2.5 text-right text-xs font-bold">{fmt(TOTAL_PN)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Distribución por ramo — pie chart */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-5">
        <h2 className="text-xs font-bold text-[#041224] uppercase mb-3">Distribución por ramo</h2>
        <div className="flex items-center gap-6">
          {/* SVG Donut */}
          <svg width={200} height={200} viewBox="0 0 200 200">
            {(() => {
              const r = 70, cx = 100, cy = 100
              const circ = 2 * Math.PI * r
              let offset = 0
              return RAMOS.map((ramo, i) => {
                const p = (ramo.pnEfectuada / TOTAL_PN) * circ
                const el = (
                  <circle key={ramo.nombre} cx={cx} cy={cy} r={r} fill="none"
                    stroke={RAMO_COLORS[i]} strokeWidth={40}
                    strokeDasharray={`${p} ${circ - p}`}
                    strokeDashoffset={-offset}
                    transform={`rotate(-90 ${cx} ${cy})`} />
                )
                offset += p
                return el
              })
            })()}
          </svg>
          {/* Legend */}
          <div className="flex flex-col gap-2">
            {RAMOS.map((r, i) => (
              <div key={r.nombre} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: RAMO_COLORS[i] }} />
                <span className="text-xs text-[#041224] font-medium">{r.nombre}</span>
                <span className="text-xs text-[#6B7280]">{((r.pnEfectuada / TOTAL_PN) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detalle por compañía */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-2">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-[#041224] border-b-2 border-b-[#E62800]">
                <th className="text-left px-2 py-2 font-semibold text-white min-w-[110px]">Compañía</th>
                <th className="text-right px-2 py-2 font-semibold text-white">Prima neta</th>
                <th className="text-right px-2 py-2 font-semibold text-white">Convenio</th>
                <th className="text-right px-2 py-2 font-semibold text-white">Diferencia</th>
                <th className="text-right px-2 py-2 font-semibold text-white">% Dif compr</th>
                <th className="text-right px-2 py-2 font-semibold text-white">PN año ant.</th>
                <th className="text-right px-2 py-2 font-semibold text-white">Dif PN AA</th>
                <th className="text-right px-2 py-2 font-semibold text-white">% Dif PN AA</th>
                <th className="text-right px-2 py-2 font-semibold text-white">Pendiente</th>
                <th className="text-right px-2 py-2 font-semibold text-white">Prima neta CIA</th>
                <th className="text-right px-2 py-2 font-semibold text-white">Dif CIA</th>
              </tr>
            </thead>
            <tbody>
              {COMPANIES.map((c, idx) => {
                const difConv = c.primaNeta - c.convenio
                const difAA = c.primaNeta - c.pnAA
                const isQualitas = c.nombre === "QUÁLITAS"
                return (
                  <tr key={c.nombre} className={`border-b border-[#E5E7E9] hover:bg-[#FFF5F5] transition-colors ${isQualitas ? "bg-[#F0FDF4]" : idx % 2 === 1 ? "bg-[#F9F9F9]" : "bg-white"}`}>
                    <td className="px-2 py-2 font-bold text-[#041224]">{c.nombre}</td>
                    <td className="px-2 py-2 text-right font-medium">{fmt(c.primaNeta)}</td>
                    <td className="px-2 py-2 text-right text-[#6B7280]">{fmt(c.convenio)}</td>
                    <td className={`px-2 py-2 text-right font-medium ${difConv < 0 ? "text-[#E62800]" : "text-[#1a7a1a]"}`}>
                      {difConv < 0 ? `(${fmt(Math.abs(difConv))})` : fmt(difConv)}
                    </td>
                    <PctBadge val={c.primaNeta} base={c.convenio} />
                    <td className="px-2 py-2 text-right text-[#6B7280]">{fmt(c.pnAA)}</td>
                    <td className={`px-2 py-2 text-right font-medium ${difAA < 0 ? "text-[#E62800]" : "text-[#1a7a1a]"}`}>
                      {difAA < 0 ? `(${fmt(Math.abs(difAA))})` : fmt(difAA)}
                    </td>
                    <PctBadge val={c.primaNeta} base={c.pnAA} />
                    <td className="px-2 py-2 text-right font-medium">{fmt(c.pendiente)}</td>
                    <td className="px-2 py-2 text-right font-medium">{fmt(c.pnCia)}</td>
                    <td className="px-2 py-2 text-right font-medium">{fmt(c.difCia)}</td>
                  </tr>
                )
              })}
              {/* TOTAL */}
              <tr className="bg-[#041224] text-white">
                <td className="px-2 py-2.5 font-bold">TOTAL</td>
                <td className="px-2 py-2.5 text-right font-bold">{fmt(compTotals.primaNeta)}</td>
                <td className="px-2 py-2.5 text-right font-bold">{fmt(compTotals.convenio)}</td>
                <td className="px-2 py-2.5 text-right font-bold">{fmt(compTotals.primaNeta - compTotals.convenio)}</td>
                <td className="px-2 py-2.5 text-right font-bold">{pct(compTotals.primaNeta, compTotals.convenio).toFixed(1)}%</td>
                <td className="px-2 py-2.5 text-right font-bold">{fmt(compTotals.pnAA)}</td>
                <td className="px-2 py-2.5 text-right font-bold">{fmt(compTotals.primaNeta - compTotals.pnAA)}</td>
                <td className="px-2 py-2.5 text-right font-bold">{pct(compTotals.primaNeta, compTotals.pnAA).toFixed(1)}%</td>
                <td className="px-2 py-2.5 text-right font-bold">{fmt(compTotals.pendiente)}</td>
                <td className="px-2 py-2.5 text-right font-bold">{fmt(compTotals.pnCia)}</td>
                <td className="px-2 py-2.5 text-right font-bold">{fmt(compTotals.difCia)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[10px] text-[#CCD1D3] mb-4 cursor-pointer hover:underline">Personalizar columnas</p>

      <PageFooter />
    </div>
  )
}
