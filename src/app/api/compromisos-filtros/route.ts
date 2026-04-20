import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

function cleanEnv(value?: string): string {
  return (value || "").replace(/\n/g, "").trim()
}

const FALLBACK_SUPABASE_URL = "https://ktqelgafkywncetxiosd.supabase.co"
const FALLBACK_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0cWVsZ2Fma3l3bmNldHhpb3NkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ1NTkzNSwiZXhwIjoyMDg3MDMxOTM1fQ.LpqL_ufAcygIc8CWs8W_cmTG0bnLR327JxQZVmL3WlI"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchEfectuadaAll(supabase: any, table: string): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = []
  let lastId: number | null = null
  for (let i = 0; i < 1000; i++) {
    let q = supabase
      .from(table)
      .select("IDDocto, LBussinesNombre, GerenciaNombre")
      .order("IDDocto", { ascending: true })
      .limit(1000)
    if (lastId !== null) q = q.gt("IDDocto", lastId)
    const { data, error } = await q
    if (error || !data || data.length === 0) break
    all.push(...(data as Record<string, unknown>[]))
    const id = Number((data[data.length - 1] as Record<string, unknown>).IDDocto)
    if (!Number.isFinite(id)) break
    lastId = id
    if (data.length < 1000) break
  }
  return all
}

export async function GET() {
  try {
    const envUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
    const envServiceRoleKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)
    const anonKey = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    const supabaseUrl = envUrl.includes("ktqelgafkywncetxiosd") ? envUrl : FALLBACK_SUPABASE_URL
    const serviceRoleKey = envServiceRoleKey && envServiceRoleKey.length > 100 ? envServiceRoleKey : FALLBACK_SERVICE_ROLE_KEY
    const apiKey = serviceRoleKey || anonKey
    if (!supabaseUrl || !apiKey) return NextResponse.json({ lineas: [], gerenciasByLinea: {} }, { headers: { "Cache-Control": "no-store" } })

    const supabase = createClient(supabaseUrl, apiKey)

    const lineasSet = new Set<string>()
    const gerByLinea = new Map<string, Set<string>>()

    for (const y of [2024, 2025, 2026]) {
      const rows = await fetchEfectuadaAll(supabase, `efectuada_${y}_drive`)
      for (const r of rows) {
        const linea = String(r.LBussinesNombre || "").trim()
        const gerencia = String(r.GerenciaNombre || "").trim()
        if (!linea) continue
        lineasSet.add(linea)
        if (!gerByLinea.has(linea)) gerByLinea.set(linea, new Set<string>())
        if (gerencia) gerByLinea.get(linea)!.add(gerencia)
      }
    }

    const lineas = Array.from(lineasSet).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }))
    const gerenciasByLinea: Record<string, string[]> = {}
    for (const l of lineas) {
      gerenciasByLinea[l] = Array.from(gerByLinea.get(l) || []).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }))
    }

    return NextResponse.json({ lineas, gerenciasByLinea }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ lineas: [], gerenciasByLinea: {} }, { headers: { "Cache-Control": "no-store" } })
  }
}
