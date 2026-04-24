import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

function cleanEnv(value?: string): string {
  return (value || "").replace(/\\n/g, "").trim()
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (typeof value === "string") {
    const n = Number(value.replace(/[$,\s]/g, ""))
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

function parseDateLike(v: unknown): Date | null {
  if (v === null || v === undefined || v === "") return null
  if (typeof v === "number") {
    const d = new Date(Math.round((v - 25569) * 86400 * 1000))
    return Number.isNaN(d.getTime()) ? null : d
  }
  const s = String(v).trim()
  if (/^\d+(\.\d+)?$/.test(s)) {
    const serial = Number(s)
    if (Number.isFinite(serial) && serial > 20000) {
      const d = new Date(Math.round((serial - 25569) * 86400 * 1000))
      return Number.isNaN(d.getTime()) ? null : d
    }
  }
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (m) {
    const mm = parseInt(m[1], 10)
    const dd = parseInt(m[2], 10)
    let yy = parseInt(m[3], 10)
    if (yy < 100) yy += 2000
    const d = new Date(Date.UTC(yy, mm - 1, dd))
    return Number.isNaN(d.getTime()) ? null : d
  }
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) {
    const yy = parseInt(iso[1], 10)
    const mm = parseInt(iso[2], 10)
    const dd = parseInt(iso[3], 10)
    const d = new Date(Date.UTC(yy, mm - 1, dd))
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

function monthFromDateLike(v: unknown): number | null {
  const d = parseDateLike(v)
  return d ? d.getUTCMonth() + 1 : null
}

function yearFromDateLike(v: unknown): number | null {
  const d = parseDateLike(v)
  return d ? d.getUTCFullYear() : null
}

function normalizeLinea(v: unknown): string {
  const x = String(v ?? "").trim()
  if (/^Click Promotor/i.test(x)) return "Click Promotorías"
  return x
}

async function fetchAll(queryFactory: () => any, pageSize = 1000): Promise<Record<string, unknown>[]> {
  const allRows: Record<string, unknown>[] = []
  let from = 0
  while (from < 200000) {
    const to = from + pageSize - 1
    const { data, error } = await queryFactory().range(from, to)
    if (error) throw new Error(error.message)
    const rows = (data || []) as Record<string, unknown>[]
    if (rows.length === 0) break
    allRows.push(...rows)
    if (rows.length < pageSize) break
    from += pageSize
  }
  return allRows
}

async function loadGerenciasDrive(supabase: SupabaseClient, linea: string, yearNum: number, months: number[]) {
  const mxParts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Mexico_City", year: "numeric", month: "numeric" }).formatToParts(new Date())
  const mxYear = Number.parseInt(mxParts.find((p) => p.type === "year")?.value || "0", 10)
  const mxMonth = Number.parseInt(mxParts.find((p) => p.type === "month")?.value || "0", 10)
  const includeMonth = (m: number | null) => months.length === 0 || (m !== null && months.includes(m))
  const includeMonthPnAA = (m: number | null) => {
    if (!(months.length === 0 || (m !== null && months.includes(m)))) return false
    if (yearNum === mxYear && m !== null) return m <= mxMonth
    return true
  }

  const effTable = `efectuada_${yearNum}_drive`
  const pptoTable = `presupuestos_${yearNum}_drive`
  const prevEffTable = yearNum > 2024 ? `efectuada_${yearNum - 1}_drive` : null

  const effRows = await fetchAll(() => {
    const effSelect = yearNum === 2026
      ? "LBussinesNombre, GerenciaNombre, PrimaNeta, Descuento, TCPago, FLiquidacion, Periodo, IDDocto, _row_id"
      : "LBussinesNombre, GerenciaNombre, PrimaNeta, Descuento, TCPago, FLiquidacion, Periodo, IDDocto"
    let q = supabase
      .from(effTable)
      .select(effSelect)
    if (linea === "Click Promotorías") q = q.in("LBussinesNombre", ["Click Promotorías", "Click Promotorias"])
    else q = q.eq("LBussinesNombre", linea)
    q = yearNum === 2026
      ? q.order("_row_id", { ascending: true })
      : q.order("IDDocto", { ascending: true }).order("FLiquidacion", { ascending: true }).order("GerenciaNombre", { ascending: true })
    return q
  })

  const pptoRows = await fetchAll(() => {
    let q = supabase
      .from(pptoTable)
      .select("LBussinesNombre, GerenciaNombre, Vendedor, Grupo, Cliente, Presupuesto, Fecha")
    if (linea === "Click Promotorías") q = q.in("LBussinesNombre", ["Click Promotorías", "Click Promotorias"])
    else q = q.eq("LBussinesNombre", linea)
    q = q
      .order("Fecha", { ascending: true })
      .order("GerenciaNombre", { ascending: true })
      .order("Vendedor", { ascending: true })
      .order("Grupo", { ascending: true })
      .order("Cliente", { ascending: true })
    return q
  })

  const prevRows = prevEffTable
    ? await fetchAll(() => {
        let q = supabase
          .from(prevEffTable)
          .select("LBussinesNombre, GerenciaNombre, PrimaNeta, Descuento, TCPago, FLiquidacion, Periodo, IDDocto")
        if (linea === "Click Promotorías") q = q.in("LBussinesNombre", ["Click Promotorías", "Click Promotorias"])
        else q = q.eq("LBussinesNombre", linea)
        q = q.order("IDDocto", { ascending: true }).order("FLiquidacion", { ascending: true }).order("GerenciaNombre", { ascending: true })
        return q
      })
    : []

  const pendingRows = await fetchAll(() => {
    let q = supabase
      .from("pendiente_drive")
      .select("LBussinesNombre, GerenciaNombre, PrimaNeta, Descuento, TCDocto, FDesde")
    if (linea === "Click Promotorías") q = q.in("LBussinesNombre", ["Click Promotorías", "Click Promotorias"])
    else q = q.eq("LBussinesNombre", linea)
    return q
  })

  const map = new Map<string, { primaNeta: number; pnAnioAnt: number; presupuesto: number; pendiente: number }>()

  for (const r of effRows) {
    if (normalizeLinea(r.LBussinesNombre) !== linea) continue
    const ger = String(r.GerenciaNombre ?? "").trim() || "Sin gerencia"
    const y = yearFromDateLike(r.FLiquidacion)
    if (y !== null && y !== yearNum) continue
    const m = monthFromDateLike(r.FLiquidacion) ?? toNumber(r.Periodo)
    if (!includeMonth(m)) continue
    const pn = (toNumber(r.PrimaNeta) - toNumber(r.Descuento)) * toNumber(r.TCPago)
    const cur = map.get(ger) || { primaNeta: 0, pnAnioAnt: 0, presupuesto: 0, pendiente: 0 }
    cur.primaNeta += pn
    map.set(ger, cur)
  }

  for (const r of pptoRows) {
    if (normalizeLinea(r.LBussinesNombre) !== linea) continue
    const ger = String(r.GerenciaNombre ?? "").trim() || "Sin gerencia"
    const m = monthFromDateLike(r.Fecha)
    if (!includeMonth(m)) continue
    const cur = map.get(ger) || { primaNeta: 0, pnAnioAnt: 0, presupuesto: 0, pendiente: 0 }
    cur.presupuesto += toNumber(r.Presupuesto)
    map.set(ger, cur)
  }

  for (const r of prevRows) {
    if (normalizeLinea(r.LBussinesNombre) !== linea) continue
    const ger = String(r.GerenciaNombre ?? "").trim() || "Sin gerencia"
    const y = yearFromDateLike(r.FLiquidacion)
    if (y !== null && y !== yearNum - 1) continue
    const m = monthFromDateLike(r.FLiquidacion) ?? toNumber(r.Periodo)
    if (!includeMonthPnAA(m)) continue
    const tcPagoRaw = r.TCPago as unknown
    const tcPago = tcPagoRaw === null || tcPagoRaw === undefined || String(tcPagoRaw).trim() === "" ? 1 : toNumber(tcPagoRaw)
    const pnAA = (toNumber(r.PrimaNeta) - toNumber(r.Descuento)) * tcPago
    const cur = map.get(ger) || { primaNeta: 0, pnAnioAnt: 0, presupuesto: 0, pendiente: 0 }
    cur.pnAnioAnt += pnAA
    map.set(ger, cur)
  }

  const todayParts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Mexico_City", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date())
  const tYear = Number.parseInt(todayParts.find((p) => p.type === "year")?.value || "0", 10)
  const tMonth = Number.parseInt(todayParts.find((p) => p.type === "month")?.value || "0", 10)
  const tDay = Number.parseInt(todayParts.find((p) => p.type === "day")?.value || "0", 10)
  const cutoff = new Date(Date.UTC(tYear, tMonth - 1, tDay, 23, 59, 59, 999))

  for (const r of pendingRows) {
    if (normalizeLinea(r.LBussinesNombre) !== linea) continue
    const ger = String(r.GerenciaNombre ?? "").trim() || "Sin gerencia"
    const d = parseDateLike(r.FDesde)
    if (!d) continue
    const yy = d.getUTCFullYear()
    const mm = d.getUTCMonth() + 1
    if (yy !== yearNum) continue
    if (!includeMonth(mm)) continue
    if (yearNum === tYear && d > cutoff) continue
    const tcDoctoRaw = r.TCDocto as unknown
    const tcDocto = tcDoctoRaw === null || tcDoctoRaw === undefined || String(tcDoctoRaw).trim() === "" ? 1 : toNumber(tcDoctoRaw)
    const pend = (toNumber(r.PrimaNeta) - toNumber(r.Descuento)) * tcDocto
    const cur = map.get(ger) || { primaNeta: 0, pnAnioAnt: 0, presupuesto: 0, pendiente: 0 }
    cur.pendiente += pend
    map.set(ger, cur)
  }

  return Array.from(map.entries())
    .map(([gerencia, v]) => ({
      gerencia,
      primaNeta: v.primaNeta,
      pnAnioAnt: v.pnAnioAnt,
      presupuesto: v.presupuesto,
      pendiente: v.pendiente,
    }))
    .filter((r) => r.primaNeta > 0 || r.presupuesto > 0)
    .sort((a, b) => a.gerencia.localeCompare(b.gerencia, "es", { sensitivity: "base" }))
}

const CACHE_HEADERS = { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" }
const NO_STORE_HEADERS = { "Cache-Control": "no-store" }

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const linea = (searchParams.get("linea") || "").trim()
    const year = parseInt(searchParams.get("year") || `${new Date().getFullYear()}`, 10)
    const meses = (searchParams.get("meses") || "")
      .split(",")
      .map((m) => parseInt(m, 10))
      .filter((m) => Number.isFinite(m) && m >= 1 && m <= 12)

    if (!linea) return NextResponse.json([], { headers: CACHE_HEADERS })
    if (![2024, 2025, 2026].includes(year)) return NextResponse.json([], { headers: CACHE_HEADERS })

    const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
    const serviceRoleKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)
    const anonKey = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const apiKey = serviceRoleKey || anonKey
    if (!supabaseUrl || !apiKey) return NextResponse.json([], { headers: NO_STORE_HEADERS })

    const supabase = createClient(supabaseUrl, apiKey)
    const rows = await loadGerenciasDrive(supabase, linea, year, meses)
    return NextResponse.json(rows, { headers: CACHE_HEADERS })
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown"
    return NextResponse.json({ error: "gerencias_failed", detail }, { status: 500 })
  }
}
