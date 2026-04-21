import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

function cleanEnv(value?: string): string {
  return (value || "").replace(/\\n/g, "").trim()
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return 0
    let normalized = trimmed.replace(/[^\d,.-]/g, "")
    if (!normalized || normalized === "-" || normalized === ".") return 0
    const hasComma = normalized.includes(",")
    const hasDot = normalized.includes(".")
    if (hasComma && hasDot) normalized = normalized.replace(/,/g, "")
    else if (hasComma && !hasDot) normalized = normalized.replace(/,/g, ".")
    const parsed = Number.parseFloat(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function normalizeKey(value: unknown): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .trim()
}

function normalizeText(value: unknown): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function monthFromDateLike(value: unknown): number | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.getMonth() + 1

  const s = String(value).trim()
  if (!s) return null

  const iso = new Date(s)
  if (!Number.isNaN(iso.getTime())) return iso.getMonth() + 1

  if (/^\d+(\.\d+)?$/.test(s)) {
    const serial = Number(s)
    if (Number.isFinite(serial) && serial > 20000) {
      const d = new Date(Math.round((serial - 25569) * 86400 * 1000))
      return Number.isNaN(d.getTime()) ? null : d.getMonth() + 1
    }
  }

  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (m) return Number.parseInt(m[1], 10)

  const monthMap: Record<string, number> = {
    enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
    julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
  }
  const key = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
  return monthMap[key] || null
}

async function fetchAllRows(queryFactory: () => any, pageSize = 1000): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = []
  let from = 0
  while (from < 300000) {
    const to = from + pageSize - 1
    const { data, error } = await queryFactory().range(from, to)
    if (error) throw error
    if (!data || data.length === 0) break
    rows.push(...(data as Record<string, unknown>[]))
    if (data.length < pageSize) break
    from += pageSize
  }
  return rows
}

function isTableMissing(message: string): boolean {
  return (
    message.includes("PGRST205") ||
    message.includes("Could not find the table") ||
    message.includes("relation")
  )
}

async function fetchAllRowsFromCandidates(
  queryFactory: (table: string) => any,
  candidates: string[],
  pageSize = 1000
): Promise<Record<string, unknown>[]> {
  for (const table of candidates) {
    try {
      return await fetchAllRows(() => queryFactory(table), pageSize)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (isTableMissing(msg)) continue
      throw err
    }
  }
  return []
}



export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const fallbackYear = new Date().getFullYear().toString()
  const year = Number.parseInt(searchParams.get("year") || fallbackYear, 10)
  const clasificacion = (searchParams.get("clasificacion") || "").trim()
  const mesesParam = searchParams.get("meses")
  const meses = mesesParam
    ? mesesParam.split(",").map((m) => Number.parseInt(m, 10)).filter((m) => Number.isFinite(m) && m >= 1 && m <= 12)
    : []

  try {
    const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
    const serviceRoleKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)
    const anonKey = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const apiKey = serviceRoleKey || anonKey

    if (!supabaseUrl || !apiKey) {
      return NextResponse.json({ error: "Supabase env not configured" }, { status: 500 })
    }

    if (![2024, 2025, 2026].includes(year)) {
      return NextResponse.json([])
    }

    const supabase = createClient(supabaseUrl, apiKey)

    const clasificacionMap = new Map<string, string>()
    {
      const { data: ciaRows } = await supabase
        .from("catalogo_compañias_drive")
        .select("CIA, ClasCIA")

      const targetClas = normalizeText(clasificacion)

      for (const row of (ciaRows || []) as Record<string, unknown>[]) {
        const key = normalizeKey(row.CIA)
        const clasTxt = String(row.ClasCIA || "Sin clasificar")
        if (!key) continue
        if (targetClas && targetClas !== "todas" && normalizeText(clasTxt) !== targetClas) continue
        clasificacionMap.set(key, clasTxt)
      }
    }

    const tableCandidates = [
      `efectuada_${year}_drive`,
      `Efectuada ${year}`,
    ]

    const rows = await fetchAllRowsFromCandidates((table) =>
      supabase
        .from(table)
        .select("CiaAbreviacion, PrimaNeta, Descuento, TCPago, FLiquidacion, Periodo")
        .not("CiaAbreviacion", "is", null),
      tableCandidates
    )

    const grouped = new Map<string, number>()

    for (const row of rows) {
      const cia = String(row.CiaAbreviacion || "").trim()
      if (!cia) continue
      const ciaKey = normalizeKey(cia)
      const filteringByClasificacion = Boolean(clasificacion && clasificacion !== "Todas")
      if (filteringByClasificacion && !clasificacionMap.has(ciaKey)) continue

      const month = monthFromDateLike(row.FLiquidacion) ?? monthFromDateLike(row.Periodo) ?? toNumber(row.Periodo)
      if (meses.length > 0 && meses.length < 12) {
        if (!month || !meses.includes(month)) continue
      }

      const prima = (toNumber(row.PrimaNeta) - toNumber(row.Descuento)) * (toNumber(row.TCPago) || 1)
      grouped.set(cia, (grouped.get(cia) || 0) + prima)
    }

    const result = Array.from(grouped.entries())
      .map(([aseguradora, primaNeta]) => ({
        aseguradora,
        primaNeta,
        clasificacion: clasificacionMap.get(normalizeKey(aseguradora)) || null,
      }))
      .filter((r) => r.primaNeta > 0)
      .sort((a, b) => a.aseguradora.localeCompare(b.aseguradora, "es", { sensitivity: "base" }))

    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: "Failed to fetch aseguradoras", detail: message }, { status: 500 })
  }
}
