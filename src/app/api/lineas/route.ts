import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

interface LineaResult {
  nombre: string
  primaNeta: number
  anioAnterior: number
  presupuesto: number
  pendiente: number
}

function cleanEnv(value?: string): string {
  return (value || "").replace(/\\n/g, "").trim()
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return 0

    // Keep digits, sign, separators. Handle formats like:
    // "$ 17,545.167", "-$ 5,668.322", "1,234", "1234.56"
    let normalized = trimmed.replace(/[^\d,.-]/g, "")
    if (!normalized || normalized === "-" || normalized === ".") return 0

    const hasComma = normalized.includes(",")
    const hasDot = normalized.includes(".")

    if (hasComma && hasDot) {
      // Assume comma is thousands separator
      normalized = normalized.replace(/,/g, "")
    } else if (hasComma && !hasDot) {
      // Assume decimal comma
      normalized = normalized.replace(/,/g, ".")
    }

    const parsed = Number.parseFloat(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function monthFromFecha(fecha: unknown): number | null {
  if (typeof fecha !== "string" || !fecha.trim()) return null

  // ISO: YYYY-MM-DD...
  const iso = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) {
    const m = Number.parseInt(iso[2], 10)
    return m >= 1 && m <= 12 ? m : null
  }

  // Fallback using Date parsing
  const dt = new Date(fecha)
  if (Number.isFinite(dt.getTime())) {
    const m = dt.getMonth() + 1
    return m >= 1 && m <= 12 ? m : null
  }

  return null
}

function lineaName(row: Record<string, unknown>): string {
  const raw = row.LBussinesNombre
  const value = typeof raw === "string" ? raw.trim() : ""
  return value || "Sin línea"
}

function isTableMissing(message: string): boolean {
  return (
    message.includes("PGRST205") ||
    message.includes("Could not find the table") ||
    message.includes("relation")
  )
}


function mexicoDateParts(): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date())

  const pick = (type: string) => Number.parseInt(parts.find((p) => p.type === type)?.value || "0", 10)
  return { year: pick("year"), month: pick("month"), day: pick("day") }
}

function normalizeMesesSelection(year: number, meses: number[], todayMx: { year: number; month: number }): number[] {
  const base = (meses.length > 0 ? meses : Array.from({ length: 12 }, (_, i) => i + 1))
    .filter((m) => Number.isFinite(m) && m >= 1 && m <= 12)
  if (year !== todayMx.year) return base
  return base.filter((m) => m <= todayMx.month)
}

function closedMeses(year: number, meses: number[], todayMx: { year: number; month: number }): number[] {
  const base = normalizeMesesSelection(year, meses, todayMx)
  if (year !== todayMx.year) return base
  return base.filter((m) => m < todayMx.month)
}

function corporateBudgetCorrection(year: number, meses: number[]): number {
  // Temporary business correction validated by stakeholder for 2026 data
  // Applies when April is in scope (or full-year request).
  if (year !== 2026) return 0
  if (meses.length === 0 || meses.includes(4)) return 12289
  return 0
}

async function loadFromSummaryTable(
  supabase: SupabaseClient,
  year: number,
  meses: number[],
  pendingOverrideByLine?: Map<string, number>
): Promise<LineaResult[] | null> {
  let currentQuery = supabase
    .from("lineas_resumen")
    .select("linea, prima_neta, presupuesto, pendiente, periodo")
    .eq("anio", year)

  if (meses.length > 0) {
    currentQuery = currentQuery.in("periodo", meses)
  }

  const { data: currentRows, error: currentError } = await currentQuery

  if (currentError) {
    if (isTableMissing(currentError.message)) return null
    throw new Error(`lineas_resumen current error: ${currentError.message}`)
  }

  if (!currentRows || currentRows.length === 0) {
    return null
  }

  let priorQuery = supabase
    .from("lineas_resumen")
    .select("linea, prima_neta, periodo")
    .eq("anio", year - 1)

  if (meses.length > 0) {
    priorQuery = priorQuery.in("periodo", meses)
  }

  const { data: priorRows, error: priorError } = await priorQuery

  if (priorError && !isTableMissing(priorError.message)) {
    throw new Error(`lineas_resumen prior error: ${priorError.message}`)
  }

  const currentByLine = new Map<string, { primaNeta: number; presupuesto: number; pendiente: number }>()
  const priorByLine = new Map<string, number>()

  for (const row of (currentRows as Record<string, unknown>[])) {
    const linea = String(row.linea || "Sin línea")
    const acc = currentByLine.get(linea) || { primaNeta: 0, presupuesto: 0, pendiente: 0 }
    acc.primaNeta += toNumber(row.prima_neta)
    acc.presupuesto += toNumber(row.presupuesto)
    acc.pendiente += toNumber(row.pendiente)
    currentByLine.set(linea, acc)
  }

  for (const row of ((priorRows || []) as Record<string, unknown>[])) {
    const linea = String(row.linea || "Sin línea")
    priorByLine.set(linea, (priorByLine.get(linea) || 0) + toNumber(row.prima_neta))
  }

  const lineas = new Set<string>([
    ...Array.from(currentByLine.keys()),
    ...Array.from(priorByLine.keys()),
    ...Array.from((pendingOverrideByLine || new Map<string, number>()).keys()),
  ])

  const rows = Array.from(lineas)
    .map((nombre) => {
      const c = currentByLine.get(nombre) || { primaNeta: 0, presupuesto: 0, pendiente: 0 }
      return {
        nombre,
        primaNeta: c.primaNeta,
        anioAnterior: priorByLine.get(nombre) || 0,
        presupuesto: c.presupuesto,
        pendiente: pendingOverrideByLine?.get(nombre) ?? c.pendiente,
      }
    })

  return rows.sort((a, b) => b.primaNeta - a.primaNeta)
}

async function accumulateEfectuada(
  supabase: SupabaseClient,
  tableName: string,
  meses: number[],
  target: Map<string, number>
): Promise<boolean> {
  const PAGE_SIZE = 5000

  for (let from = 0; from < 1_000_000; from += PAGE_SIZE) {
    let query = supabase
      .from(tableName)
      .select("LBussinesNombre, PrimaNeta, Descuento, TCPago, Periodo")
      .order("IDDocto", { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (meses.length > 0) {
      query = query.in("Periodo", meses)
    }

    const { data, error } = await query

    if (error) {
      if (isTableMissing(error.message)) return false
      throw new Error(`${tableName} error: ${error.message}`)
    }

    const rows = (data || []) as Record<string, unknown>[]
    if (rows.length === 0) return true

    for (const row of rows) {
      const linea = lineaName(row)
      const prima = toNumber(row.PrimaNeta)
      const descuento = toNumber(row.Descuento)
      const tc = toNumber(row.TCPago) || 1
      const primaOficial = (prima - descuento) * tc

      target.set(linea, (target.get(linea) || 0) + primaOficial)
    }

    if (rows.length < PAGE_SIZE) return true
  }

  return true
}

async function accumulateEfectuadaFromCandidates(
  supabase: SupabaseClient,
  tableNames: string[],
  meses: number[],
  target: Map<string, number>
): Promise<string | null> {
  for (const tableName of tableNames) {
    const ok = await accumulateEfectuada(supabase, tableName, meses, target)
    if (ok) return tableName
  }
  return null
}

async function accumulatePresupuesto(
  supabase: SupabaseClient,
  tableName: string,
  meses: number[],
  target: Map<string, number>
): Promise<boolean> {
  const PAGE_SIZE = 5000

  for (let from = 0; from < 1_000_000; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(tableName)
      .select("LBussinesNombre, Presupuesto, Fecha")
      .order("Fecha", { ascending: true })
      .order("LBussinesNombre", { ascending: true })
      .order("Vendedor", { ascending: true })
      .order("Cliente", { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      if (isTableMissing(error.message)) return false
      throw new Error(`${tableName} error: ${error.message}`)
    }

    const rows = (data || []) as Record<string, unknown>[]
    if (rows.length === 0) return true

    for (const row of rows) {
      const month = monthFromFecha(row.Fecha)
      if (meses.length > 0 && month !== null && !meses.includes(month)) continue

      const linea = lineaName(row)
      const presupuesto = toNumber(row.Presupuesto)
      target.set(linea, (target.get(linea) || 0) + presupuesto)
    }

    if (rows.length < PAGE_SIZE) return true
  }

  return true
}

function parseFDesdeDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null

  if (typeof value === "number") {
    const d = new Date(Math.round((value - 25569) * 86400 * 1000))
    return Number.isNaN(d.getTime()) ? null : d
  }

  const txt = String(value).trim()
  if (!txt) return null

  if (/^\d+(\.\d+)?$/.test(txt)) {
    const n = Number(txt)
    if (Number.isFinite(n)) {
      const d = new Date(Math.round((n - 25569) * 86400 * 1000))
      return Number.isNaN(d.getTime()) ? null : d
    }
  }

  const mdy = txt.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (mdy) {
    const mm = Number.parseInt(mdy[1], 10)
    const dd = Number.parseInt(mdy[2], 10)
    let yy = Number.parseInt(mdy[3], 10)
    if (yy < 100) yy += 2000
    const d = new Date(Date.UTC(yy, mm - 1, dd))
    return Number.isNaN(d.getTime()) ? null : d
  }

  const iso = new Date(txt)
  return Number.isNaN(iso.getTime()) ? null : iso
}

function mexicoTodayParts(): { year: number; month: number; day: number } {
  const now = new Date()
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now)

  const get = (type: string) => Number.parseInt(parts.find((p) => p.type === type)?.value || "0", 10)
  return { year: get("year"), month: get("month"), day: get("day") }
}

async function accumulatePendiente(
  supabase: SupabaseClient,
  year: number,
  meses: number[],
  target: Map<string, number>
): Promise<boolean> {
  const PAGE_SIZE = 5000
  const todayMx = mexicoTodayParts()
  const cutoffDateUtc = new Date(Date.UTC(todayMx.year, todayMx.month - 1, todayMx.day, 23, 59, 59, 999))

  for (let from = 0; from < 1_000_000; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("pendiente_drive")
      .select("LBussinesNombre, PrimaNeta, Descuento, TCDocto, FDesde")
      .order("LBussinesNombre", { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      if (isTableMissing(error.message)) return false
      throw new Error(`pendiente_drive error: ${error.message}`)
    }

    const rows = (data || []) as Record<string, unknown>[]
    if (rows.length === 0) return true

    for (const row of rows) {
      const fecha = parseFDesdeDate(row.FDesde)
      if (!fecha) continue

      const yyyy = fecha.getUTCFullYear()
      const mm = fecha.getUTCMonth() + 1
      if (yyyy !== year) continue
      if (meses.length > 0 && !meses.includes(mm)) continue

      // Business rule: for current year, accumulate only up to today's date (MX timezone)
      if (year === todayMx.year && fecha > cutoffDateUtc) continue

      const linea = lineaName(row)
      const prima = toNumber(row.PrimaNeta)
      const desc = toNumber(row.Descuento)
      const tcDocto = toNumber(row.TCDocto)
      const pendiente = (prima - desc) * tcDocto

      target.set(linea, (target.get(linea) || 0) + pendiente)
    }

    if (rows.length < PAGE_SIZE) return true
  }

  return true
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const fallbackYear = new Date().getFullYear().toString()
  const year = Number.parseInt(searchParams.get("year") || fallbackYear, 10)

  const mesesParam = searchParams.get("meses")
  const meses = mesesParam
    ? mesesParam
        .split(",")
        .map((m) => Number.parseInt(m, 10))
        .filter((m) => Number.isFinite(m) && m >= 1 && m <= 12)
    : []

  try {
    const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
    const serviceRoleKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)
    const anonKey = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const apiKey = serviceRoleKey || anonKey

    if (!supabaseUrl || !apiKey) {
      return NextResponse.json(
        { error: "Supabase env not configured (NEXT_PUBLIC_SUPABASE_URL + key)" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, apiKey)

    const todayMx = mexicoDateParts()
    const mesesSelected = normalizeMesesSelection(year, meses, todayMx)
    const mesesClosed = closedMeses(year, meses, todayMx)

    const pendingByLine = new Map<string, number>()
    await accumulatePendiente(supabase, year, mesesSelected, pendingByLine)

    // Fast path: pre-aggregated summary table
    const summary = await loadFromSummaryTable(supabase, year, mesesClosed, pendingByLine)
    if (summary && summary.length > 0) {
      return NextResponse.json(summary, {
        headers: {
          "Cache-Control": "no-store",
          "x-lineas-source": "summary+pendiente-fdesde",
        },
      })
    }

    // Fallback path: aggregate from raw year tables
    const currentByLine = new Map<string, number>()
    const priorByLine = new Map<string, number>()
    const budgetByLine = new Map<string, number>()

    const currentTableCandidates =
      year === 2026 ? ["efectuada_2026_drive", `Efectuada ${year}`] : [`Efectuada ${year}`]
    const priorTableCandidates = [`Efectuada ${year - 1}`]
    const budgetTable = `Presupuestos ${year}`

    const currentSource = await accumulateEfectuadaFromCandidates(
      supabase,
      currentTableCandidates,
      mesesClosed,
      currentByLine
    )
    if (!currentSource) {
      throw new Error(`Missing source table for year ${year}: ${currentTableCandidates.join(" | ")}`)
    }

    await accumulateEfectuadaFromCandidates(supabase, priorTableCandidates, mesesClosed, priorByLine)

    // Budget table is currently expected mostly for 2026, but keep dynamic naming.
    await accumulatePresupuesto(supabase, budgetTable, mesesClosed, budgetByLine)

    const lineas = new Set<string>([
      ...Array.from(currentByLine.keys()),
      ...Array.from(priorByLine.keys()),
      ...Array.from(budgetByLine.keys()),
      ...Array.from(pendingByLine.keys()),
    ])

    const result: LineaResult[] = Array.from(lineas)
      .map((nombre) => ({
        nombre,
        primaNeta: currentByLine.get(nombre) || 0,
        anioAnterior: priorByLine.get(nombre) || 0,
        presupuesto: budgetByLine.get(nombre) || 0,
        pendiente: pendingByLine.get(nombre) || 0,
      }))

    result.sort((a, b) => b.primaNeta - a.primaNeta)

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
        "x-lineas-source": "raw-fallback",
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: "Failed to fetch", detail: message }, { status: 500 })
  }
}
