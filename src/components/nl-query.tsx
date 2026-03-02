"use client"

import { useState } from "react"
import { Send, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

// Feature flag — set to true to enable in production
const NL_ENABLED = false

const SCHEMA_CONTEXT = `
Table: public.dashboard_data
Columns: IDEjecut(bigint), EjecutNombre(text), FLiquidacion(text), DeptosNombre(text), IDSRamo(bigint), Sub_Ramo(text), PrimaNeta(float), Descuento(text), TCPago(float), IDCia(bigint), CiaAbreviacion(text), LBussinesNombre(text), IDDespacho(bigint), GerenciaNombre(text), Grupo(text), Documento(text), IDVend(bigint), Clave_Enroller(text), VendNombre(text), IDCli(bigint), NombreCompleto(text), TipoDocto(text), Periodo(bigint), FLimPago(text), EjecutCobNombre(text), SubGrupo(text), RamosNombre(text), CAgente(text)
Formula: Prima Cobrada = (PrimaNeta - CAST(Descuento AS DECIMAL)) * TCPago
LBussinesNombre values: Corporate, Cartera Tradicional
GerenciaNombre values: Business, Diamond, Partner, Socios
Periodo: 1-12 (month number)
FLiquidacion format: M/DD/YY H:mm
`

interface NLQueryProps {
  periodo: number
  year: string
}

export function NLQuery({ periodo, year }: NLQueryProps) {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ answer: string; data?: Record<string, unknown>[] } | null>(null)
  const [error, setError] = useState("")

  if (!NL_ENABLED) return null

  const handleSubmit = async () => {
    if (!query.trim() || loading) return
    setLoading(true)
    setError("")
    setResult(null)

    try {
      // Call Claude to generate SQL
      const claudeRes = await fetch("/api/nl-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query, schema: SCHEMA_CONTEXT, periodo, year }),
      })

      if (!claudeRes.ok) throw new Error("Error en el servicio de IA")

      const { sql, explanation } = await claudeRes.json()

      // Execute the generated SQL via Supabase RPC
      // For safety: only SELECT queries
      if (!sql.trim().toUpperCase().startsWith("SELECT")) {
        throw new Error("Solo se permiten consultas de lectura")
      }

      const { data, error: dbError } = await supabase.rpc("run_readonly_query", { query_text: sql })
      if (dbError) throw new Error(dbError.message)

      setResult({ answer: explanation, data: data as Record<string, unknown>[] })
    } catch (err) {
      setError(String(err))
    }
    setLoading(false)
  }

  return (
    <div className="bi-card p-3 mt-4">
      <p className="text-[10px] text-[#CCD1D3] uppercase font-bold mb-2">🧪 Beta — Pregunta sobre tus datos</p>
      <div className="flex items-center gap-2">
        <input
          id="nl-query-input"
          name="nl-query"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          placeholder="Pregunta sobre tus datos..."
          className="flex-1 border border-[#E5E7EB] rounded px-3 py-1.5 text-xs bg-white"
        />
        <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium bg-[#041224] text-white hover:bg-[#0a1e38] disabled:opacity-50">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          Preguntar
        </button>
      </div>

      {error && <p className="text-xs text-[#E62800] mt-2">{error}</p>}

      {result && (
        <div className="mt-3">
          <p className="text-xs text-[#111] mb-2">{result.answer}</p>
          {result.data && result.data.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-[#041224] text-white">
                    {Object.keys(result.data[0]).map(k => (
                      <th key={k} className="px-2 py-1 text-left font-semibold">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.data.slice(0, 20).map((row, i) => (
                    <tr key={i} className={`border-b border-[#F0F0F0] ${i % 2 === 1 ? "bg-[#FAFAFA]" : ""}`}>
                      {Object.values(row).map((v, j) => (
                        <td key={j} className="px-2 py-1">{String(v)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
