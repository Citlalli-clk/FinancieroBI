import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

function cleanEnv(value?: string): string {
  return (value || "").replace(/\n/g, "").trim()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAll(queryFactory: () => any, pageSize = 5000): Promise<Record<string, unknown>[]> {
  const allRows: Record<string, unknown>[] = []
  for (let from = 0; from < 300000; from += pageSize) {
    const to = from + pageSize - 1
    const { data, error } = await queryFactory().range(from, to)
    if (error) break
    if (!data || data.length === 0) break
    allRows.push(...(data as Record<string, unknown>[]))
    if (data.length < pageSize) break
  }
  return allRows
}

function monthFromDateLike(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null
  if (typeof v === "number") {
    const d = new Date(Math.round((v - 25569) * 86400 * 1000))
    return Number.isNaN(d.getTime()) ? null : d.getMonth() + 1
  }
  const s = String(v).trim()
  const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (m1) {
    const mm = parseInt(m1[1], 10)
    return mm >= 1 && mm <= 12 ? mm : null
  }
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m2) {
    const mm = parseInt(m2[2], 10)
    return mm >= 1 && mm <= 12 ? mm : null
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get("year") || `${new Date().getFullYear()}`, 10)
    const mesesParam = (searchParams.get("meses") || "").trim()
    const meses = (mesesParam ? mesesParam.split(",") : [`${new Date().getMonth() + 1}`])
      .map((m) => parseInt(m, 10))
      .filter((m) => Number.isFinite(m) && m >= 1 && m <= 12)
    const mesesSet = new Set<number>(meses)

    const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
    const serviceRoleKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)
    const anonKey = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const apiKey = serviceRoleKey || anonKey
    if (!supabaseUrl || !apiKey) return NextResponse.json({ lineas: [], gerenciasByLinea: {} }, { headers: { "Cache-Control": "no-store" } })

    const supabase = createClient(supabaseUrl, apiKey)
    const lineasSet = new Set<string>()
    const gerByLinea = new Map<string, Set<string>>()

    const rows = await fetchAll(() =>
      supabase
        .from(`efectuada_${year}_drive`)
        .select("LBussinesNombre, GerenciaNombre, FLiquidacion")
    )

    for (const r of rows) {
      const m = monthFromDateLike(r.FLiquidacion)
      if (!Number.isFinite(m) || !mesesSet.has(Number(m))) continue
      const linea = String(r.LBussinesNombre || "").trim()
      const gerencia = String(r.GerenciaNombre || "").trim()
      if (!linea) continue
      lineasSet.add(linea)
      if (!gerByLinea.has(linea)) gerByLinea.set(linea, new Set<string>())
      if (gerencia) gerByLinea.get(linea)!.add(gerencia)
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
