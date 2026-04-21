import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

function cleanEnv(value?: string): string {
  return (value || "").replace(/\n/g, "").trim()
}

const FALLBACK_SUPABASE_URL = "https://ktqelgafkywncetxiosd.supabase.co"
const FALLBACK_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0cWVsZ2Fma3l3bmNldHhpb3NkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ1NTkzNSwiZXhwIjoyMDg3MDMxOTM1fQ.LpqL_ufAcygIc8CWs8W_cmTG0bnLR327JxQZVmL3WlI"

function parseNum(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0
  if (typeof v === "number") return Number.isFinite(v) ? v : 0
  let s = String(v).trim().replace(/[^\d,.-]/g, "")
  if (!s || s === "-" || s === ".") return 0
  const lc = s.lastIndexOf(",")
  const ld = s.lastIndexOf(".")
  if (lc !== -1 && ld !== -1) {
    if (ld > lc) s = s.replace(/,/g, "")
    else s = s.replace(/\./g, "").replace(",", ".")
  } else if (lc !== -1) {
    s = s.replace(",", ".")
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

function normalizeText(v: unknown): string {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

function monthFromDateLike(v: unknown): number | null {
  if (!v) return null
  if (typeof v === "number") {
    const d = new Date(Math.round((v - 25569) * 86400 * 1000))
    return Number.isNaN(d.getTime()) ? null : d.getMonth() + 1
  }
  const s = String(v).trim()
  const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (m1) return parseInt(m1[1], 10)
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m2) return parseInt(m2[2], 10)
  const monthMap: Record<string, number> = {
    enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
    julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
  }
  const k = normalizeText(s)
  return monthMap[k] || null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchEfectuadaAll(supabase: any, table: string, columns: string): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = []
  let lastId: number | null = null
  for (let i = 0; i < 1000; i++) {
    let q = supabase.from(table).select(columns).order("IDDocto", { ascending: true }).limit(1000)
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchByRange(queryFactory: () => any, pageSize = 1000): Promise<Record<string, unknown>[]> {
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get("year") || `${new Date().getFullYear()}`, 10)
    const mesesParam = (searchParams.get("meses") || "").trim()
    const meses = (mesesParam ? mesesParam.split(",") : [])
      .map((m) => parseInt(m, 10))
      .filter((m) => Number.isFinite(m) && m >= 1 && m <= 12)
    const mesesSet = new Set<number>(meses)

    const envUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
    const envServiceRoleKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)
    const anonKey = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    const supabaseUrl = envUrl.includes("ktqelgafkywncetxiosd") ? envUrl : FALLBACK_SUPABASE_URL
    const serviceRoleKey = envServiceRoleKey && envServiceRoleKey.length > 100 ? envServiceRoleKey : FALLBACK_SERVICE_ROLE_KEY
    const apiKey = serviceRoleKey || anonKey
    if (!supabaseUrl || !apiKey) {
      return NextResponse.json({ nombre: "Gobierno", primaNeta: 0, anioAnterior: 0, presupuesto: 0 }, { headers: { "Cache-Control": "no-store" } })
    }

    const supabase = createClient(supabaseUrl, apiKey)

    const inMonth = (m: number | null) => mesesSet.size === 0 || (m !== null && mesesSet.has(m))
    const isGobierno = (v: unknown) => normalizeText(v) === "gobierno"

    let primaNeta = 0
    let anioAnterior = 0
    let presupuesto = 0

    const currentRows = await fetchEfectuadaAll(
      supabase,
      `efectuada_${year}_drive`,
      "IDDocto, LBussinesNombre, PrimaNeta, Descuento, TCPago, FLiquidacion, Periodo"
    )

    for (const r of currentRows) {
      if (!isGobierno(r.LBussinesNombre)) continue
      const m = monthFromDateLike(r.FLiquidacion) ?? monthFromDateLike(r.Periodo) ?? parseNum(r.Periodo)
      if (!inMonth(m)) continue
      primaNeta += (parseNum(r.PrimaNeta) - parseNum(r.Descuento)) * (parseNum(r.TCPago) || 1)
    }

    const prevRows = await fetchEfectuadaAll(
      supabase,
      `efectuada_${year - 1}_drive`,
      "IDDocto, LBussinesNombre, PrimaNeta, Descuento, TCPago, FLiquidacion, Periodo"
    )

    for (const r of prevRows) {
      if (!isGobierno(r.LBussinesNombre)) continue
      const m = monthFromDateLike(r.FLiquidacion) ?? monthFromDateLike(r.Periodo) ?? parseNum(r.Periodo)
      if (!inMonth(m)) continue
      anioAnterior += (parseNum(r.PrimaNeta) - parseNum(r.Descuento)) * (parseNum(r.TCPago) || 1)
    }

    const pptoRows = await fetchByRange(() =>
      supabase
        .from(`presupuestos_${year}_drive`)
        .select("LBussinesNombre, Presupuesto, Fecha")
        .order("Fecha", { ascending: true })
    )

    for (const r of pptoRows) {
      if (!isGobierno(r.LBussinesNombre)) continue
      const m = monthFromDateLike(r.Fecha)
      if (!inMonth(m)) continue
      presupuesto += parseNum(r.Presupuesto)
    }

    return NextResponse.json(
      {
        nombre: "Gobierno",
        primaNeta: Math.round(primaNeta),
        anioAnterior: Math.round(anioAnterior),
        presupuesto: Math.round(presupuesto),
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch {
    return NextResponse.json({ nombre: "Gobierno", primaNeta: 0, anioAnterior: 0, presupuesto: 0 }, { headers: { "Cache-Control": "no-store" } })
  }
}
