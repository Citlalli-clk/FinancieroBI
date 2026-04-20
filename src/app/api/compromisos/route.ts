import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

function cleanEnv(value?: string): string {
  return (value || "").replace(/\n/g, "").trim()
}

function parseNum(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0
  if (typeof v === "number") return Number.isFinite(v) ? v : 0
  let s = String(v).trim()
  if (!s) return 0
  s = s.replace(/[^\d,.-]/g, "")
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

function normalizeText(v: unknown): string {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get("year") || `${new Date().getFullYear()}`, 10)
    const mes = parseInt(searchParams.get("mes") || `${new Date().getMonth() + 1}`, 10)

    const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
    const serviceRoleKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)
    const anonKey = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const apiKey = serviceRoleKey || anonKey
    if (!supabaseUrl || !apiKey) return NextResponse.json([], { headers: { "Cache-Control": "no-store" } })

    const supabase = createClient(supabaseUrl, apiKey)

    const effTable = `efectuada_${year}_drive`
    const pptoTable = `presupuestos_${year}_drive`

    const catalogRows = await fetchAll(() =>
      supabase
        .from("catalogo_vendedores_drive")
        .select("clave, nombre, estatus, gerencia")
        .order("clave", { ascending: true })
    )

    const byClave = new Map<string, Record<string, unknown>>()
    const byNombre = new Map<string, Record<string, unknown>>()

    for (const r of catalogRows) {
      const k = normalizeText(r.clave)
      const n = normalizeText(r.nombre)
      const estatus = normalizeText(r.estatus)
      const isActive = estatus === "activo"
      if (k && k !== "null" && k !== "0") {
        const prev = byClave.get(k)
        if (!prev || (normalizeText(prev.estatus) !== "activo" && isActive)) byClave.set(k, r)
      }
      if (n) {
        const prev = byNombre.get(n)
        if (!prev || (normalizeText(prev.estatus) !== "activo" && isActive)) byNombre.set(n, r)
      }
    }

    const effRows = await fetchAll(() =>
      supabase
        .from(effTable)
        .select("Clave_Enroller, VendNombre, PrimaNeta, Descuento, TCPago, FLiquidacion, Periodo")
        .order("IDDocto", { ascending: true })
    )

    const pptoRows = await fetchAll(() =>
      supabase
        .from(pptoTable)
        .select("Vendedor, Presupuesto, Fecha")
        .order("Fecha", { ascending: true })
    )

    const acc = new Map<string, { vendedor: string; meta: number; primaActual: number }>()

    const getKeyAndName = (clave: unknown, nombre: unknown): { key: string; display: string } => {
      const kc = normalizeText(clave)
      const nn = normalizeText(nombre)
      const c = (kc && kc !== "null" && kc !== "0" ? byClave.get(kc) : null) || byNombre.get(nn)
      const display = c ? String(c.nombre || nombre || "Sin vendedor") : String(nombre || "Sin vendedor")
      const key = c ? `cat:${normalizeText(c.clave) || normalizeText(c.nombre)}` : `raw:${nn}`
      return { key, display }
    }

    for (const r of effRows) {
      const m = monthFromDateLike(r.FLiquidacion) ?? parseNum(r.Periodo)
      if (m !== mes) continue
      const { key, display } = getKeyAndName(r.Clave_Enroller, r.VendNombre)
      const cur = acc.get(key) || { vendedor: display, meta: 0, primaActual: 0 }
      cur.primaActual += (parseNum(r.PrimaNeta) - parseNum(r.Descuento)) * (parseNum(r.TCPago) || 1)
      acc.set(key, cur)
    }

    for (const r of pptoRows) {
      const m = monthFromDateLike(r.Fecha)
      if (m !== mes) continue
      const { key, display } = getKeyAndName(null, r.Vendedor)
      const cur = acc.get(key) || { vendedor: display, meta: 0, primaActual: 0 }
      cur.meta += parseNum(r.Presupuesto)
      acc.set(key, cur)
    }

    const out = Array.from(acc.values())
      .map((r) => ({
        vendedor: r.vendedor,
        meta: Math.round(r.meta),
        primaActual: Math.round(r.primaActual),
        pctAvance: r.meta > 0 ? Math.round((r.primaActual / r.meta) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.meta - a.meta)

    return NextResponse.json(out, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json([], { headers: { "Cache-Control": "no-store" } })
  }
}
