"use client"

import { useState, useEffect } from "react"
import { PageTabs } from "@/components/page-tabs"
import { PageFooter } from "@/components/page-footer"
import { supabase } from "@/lib/supabase"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"

function fmt(v: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

interface CobranzaDia {
  fecha: string
  gerencia: string
  prima_cobrada: number
  meta_dia: number
  diferencia: number
  acumulado: number
}

const SEED: CobranzaDia[] = [
  { fecha: "2026-02-21", gerencia: "Diamond", prima_cobrada: 1245000, meta_dia: 1100000, diferencia: 145000, acumulado: 18750000 },
  { fecha: "2026-02-22", gerencia: "Diamond", prima_cobrada: 980000, meta_dia: 1100000, diferencia: -120000, acumulado: 19730000 },
  { fecha: "2026-02-23", gerencia: "Business", prima_cobrada: 1520000, meta_dia: 1300000, diferencia: 220000, acumulado: 21250000 },
  { fecha: "2026-02-24", gerencia: "Partner", prima_cobrada: 870000, meta_dia: 1100000, diferencia: -230000, acumulado: 22120000 },
  { fecha: "2026-02-25", gerencia: "Socios", prima_cobrada: 1100000, meta_dia: 1050000, diferencia: 50000, acumulado: 23220000 },
  { fecha: "2026-02-26", gerencia: "Diamond", prima_cobrada: 1350000, meta_dia: 1100000, diferencia: 250000, acumulado: 24570000 },
  { fecha: "2026-02-27", gerencia: "Business", prima_cobrada: 1050000, meta_dia: 1300000, diferencia: -250000, acumulado: 25620000 },
]

export default function CobranzaDiaPage() {
  const [data, setData] = useState<CobranzaDia[]>(SEED)
  useEffect(() => { document.title = "Cobranza por día | CLK BI Dashboard" }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const { data: rows, error } = await supabase
          .schema("bi_dashboard")
          .from("fact_cobranza_diaria")
          .select("*")
          .order("fecha", { ascending: true })
        if (!error && rows?.length) {
          setData(rows as unknown as CobranzaDia[])
        }
      } catch { /* seed fallback */ }
    })()
  }, [])

  const metaTotal = data.reduce((s, r) => s + r.meta_dia, 0)
  const cobradoTotal = data.reduce((s, r) => s + r.prima_cobrada, 0)
  const cumplimiento = metaTotal > 0 ? Math.round((cobradoTotal / metaTotal) * 100) : 0
  const lastAcumulado = data[data.length - 1]?.acumulado ?? 0

  const chartData = data.map(r => ({
    fecha: r.fecha.slice(5),
    cobrado: Math.round(r.prima_cobrada / 1e6 * 10) / 10,
    meta: Math.round(r.meta_dia / 1e6 * 10) / 10,
  }))

  return (
    <div>
      <PageTabs />
      <h1 className="text-base font-bold text-[#111] font-lato mb-4">Cobranza por día</h1>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bi-card border-l-4 border-l-[#E62800] p-3">
          <div className="text-[9px] text-gray-500 uppercase tracking-wide font-medium mb-1">Meta del día</div>
          <div className="text-2xl font-bold text-[#111] font-lato">{fmt(metaTotal / data.length)}</div>
        </div>
        <div className="bi-card border-l-4 border-l-[#041224] p-3">
          <div className="text-[9px] text-gray-500 uppercase tracking-wide font-medium mb-1">Cobrado hoy</div>
          <div className="text-2xl font-bold text-[#166534] font-lato">{fmt(data[data.length - 1]?.prima_cobrada ?? 0)}</div>
        </div>
        <div className="bi-card p-3" style={{ background: "#041224" }}>
          <div className="text-[9px] text-white/70 uppercase tracking-wide font-medium mb-1">Cumplimiento diario</div>
          <div className="text-2xl font-bold text-white font-lato">{cumplimiento}%</div>
          <div className="text-[10px] text-white/60 mt-0.5">Acumulado: {fmt(lastAcumulado)}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bi-card p-4 mb-4">
        <div className="text-xs font-medium text-gray-500 mb-2">Tendencia diaria (millones)</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis dataKey="fecha" fontSize={10} tick={{ fill: "#666" }} />
            <YAxis fontSize={10} tick={{ fill: "#666" }} tickFormatter={v => `$${v}M`} />
            <Tooltip formatter={(v: unknown) => [`$${v}M`]} />
            <Line type="monotone" dataKey="cobrado" stroke="#111111" strokeWidth={2} dot={{ r: 3 }} name="Cobrado" />
            <Line type="monotone" dataKey="meta" stroke="#E62800" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Meta" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="bi-card overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#041224] text-white border-b-2 border-b-[#E62800]">
              <th className="text-left px-3 py-2 font-semibold text-gray-600">Fecha</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-600">Gerencia</th>
              <th className="text-right px-3 py-2 font-semibold text-gray-600">Prima cobrada</th>
              <th className="text-right px-3 py-2 font-semibold text-gray-600">Meta</th>
              <th className="text-right px-3 py-2 font-semibold text-gray-600">Diferencia</th>
              <th className="text-right px-3 py-2 font-semibold text-gray-600">%</th>
              <th className="text-right px-3 py-2 font-semibold text-gray-600">Acumulado</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r, i) => {
              const pct = r.meta_dia > 0 ? Math.round((r.prima_cobrada / r.meta_dia) * 100) : 0
              const neg = r.diferencia < 0
              return (
                <tr key={i} className={`border-b border-[#F0F0F0] hover:bg-[#FFF5F5] ${i % 2 === 1 ? "bg-[#FAFAFA]" : ""}`}>
                  <td className="px-3 py-1.5 text-gray-600">{r.fecha}</td>
                  <td className="px-3 py-1.5 font-medium text-[#111]">{r.gerencia}</td>
                  <td className="px-3 py-1.5 text-right font-medium">{fmt(r.prima_cobrada)}</td>
                  <td className="px-3 py-1.5 text-right text-gray-500">{fmt(r.meta_dia)}</td>
                  <td className={`px-3 py-1.5 text-right font-medium ${neg ? "text-[#E62800]" : "text-[#166534]"}`}>
                    {neg ? `(${fmt(Math.abs(r.diferencia))})` : fmt(r.diferencia)}
                  </td>
                  <td className={`px-3 py-1.5 text-right ${pct < 100 ? "text-[#E62800]" : "text-[#166534]"}`}>{pct}%</td>
                  <td className="px-3 py-1.5 text-right text-gray-500">{fmt(r.acumulado)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <PageFooter />
    </div>
  )
}
