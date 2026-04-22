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
  return null
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
    const level = (searchParams.get("level") || "gerencia").toLowerCase()
    const year = parseInt(searchParams.get("year") || `${new Date().getFullYear()}`, 10)
    const mesesParam = (searchParams.get("meses") || "").trim()
    const meses = (mesesParam ? mesesParam.split(",") : [])
      .map((m) => parseInt(m, 10))
      .filter((m) => Number.isFinite(m) && m >= 1 && m <= 12)
    const mesesSet = new Set<number>(meses)

    const gerencia = normalizeText(searchParams.get("gerencia"))
    const vendedor = normalizeText(searchParams.get("vendedor"))
    const grupo = normalizeText(searchParams.get("grupo"))

    const envUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
    const envServiceRoleKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)
    const anonKey = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    const supabaseUrl = envUrl.includes("ktqelgafkywncetxiosd") ? envUrl : FALLBACK_SUPABASE_URL
    const serviceRoleKey = envServiceRoleKey && envServiceRoleKey.length > 100 ? envServiceRoleKey : FALLBACK_SERVICE_ROLE_KEY
    const apiKey = serviceRoleKey || anonKey
    if (!supabaseUrl || !apiKey) return NextResponse.json([])

    const supabase = createClient(supabaseUrl, apiKey)

    const rows = await fetchByRange(() =>
      supabase
        .from("pendiente_drive")
        .select("LBussinesNombre, GerenciaNombre, VendNombre, Grupo, NombreCompleto, PrimaNeta, Descuento, TCDocto, Periodo")
    )

    // Business decision: pendiente uses full Pendiente sheet (not month-limited)
    const isCorporate = (v: unknown) => normalizeText(v) === "corporate"

    const grouped = new Map<string, number>()
    for (const r of rows) {
      if (!isCorporate(r.LBussinesNombre)) continue
      const g = normalizeText(r.GerenciaNombre)
      const v = normalizeText(r.VendNombre)
      const gr = normalizeText(r.Grupo)

      if (gerencia && g !== gerencia) continue
      if (vendedor && v !== vendedor) continue
      if (grupo && gr !== grupo) continue

      let key = String(r.GerenciaNombre || "Sin gerencia").trim()
      if (level === "vendedor") key = String(r.VendNombre || "Sin vendedor").trim()
      else if (level === "grupo") key = String(r.Grupo || "Sin grupo").trim()
      else if (level === "cliente") key = String(r.NombreCompleto || "Sin cliente").trim()

      const pendiente = (parseNum(r.PrimaNeta) - parseNum(r.Descuento)) * (parseNum(r.TCDocto) || parseNum(r.TCPago) || 1)
      grouped.set(key, (grouped.get(key) || 0) + pendiente)
    }

    const out = Array.from(grouped.entries()).map(([name, pendiente]) => ({ name, pendiente: Math.round(pendiente) }))
    return NextResponse.json(out, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } })
  } catch {
    return NextResponse.json([])
  }
}
