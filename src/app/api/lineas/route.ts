import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// Server-side Supabase client with service_role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function calcPrima(row: Record<string, unknown>): number {
  const prima = (row.PrimaNeta as number) || 0
  const tc = (row.TCPago as number) || 1
  const desc = parseFloat(row.Descuento as string) || 0
  return (prima - desc) * tc
}

async function fetchAllDashboardRows(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  yr: number,
  meses: number[]
): Promise<Record<string, unknown>[]> {
  const allRows: Record<string, unknown>[] = []
  const pageSize = 1000
  let from = 0
  const maxRows = 300000 // safety cap

  while (from < maxRows) {
    const to = from + pageSize - 1
    let q = supabase
      .from("dashboard_data")
      .select("LBussinesNombre, PrimaNeta, TCPago, Descuento")
      .eq("anio", yr)

    if (meses.length > 0) {
      q = q.in("mes", meses)
    }

    const { data, error } = await q.range(from, to)
    if (error) {
      throw new Error(`Supabase page error (year=${yr}, from=${from}): ${error.message}`)
    }

    if (!data || data.length === 0) break

    allRows.push(...(data as Record<string, unknown>[]))
    if (data.length < pageSize) break
    from += pageSize
  }

  return allRows
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const year = parseInt(searchParams.get("year") || "2026", 10)
  const mesesParam = searchParams.get("meses") // comma-separated: "1,2,3"
  const meses = mesesParam
    ? mesesParam
        .split(",")
        .map((m) => parseInt(m, 10))
        .filter((m) => Number.isFinite(m) && m >= 1 && m <= 12)
    : []

  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Supabase server env not configured" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Fetch current year + prior year with pagination (avoids row truncation)
    const [currentRows, priorRows] = await Promise.all([
      fetchAllDashboardRows(supabase, year, meses),
      fetchAllDashboardRows(supabase, year - 1, meses),
    ])

    const groupBy = (rows: Record<string, unknown>[]) => {
      const grouped: Record<string, number> = {}
      for (const row of rows) {
        const k = (row.LBussinesNombre as string) || "?"
        grouped[k] = (grouped[k] || 0) + calcPrima(row)
      }
      return grouped
    }

    const currentGrouped = groupBy(currentRows)
    const priorGrouped = groupBy(priorRows)

    const allLineas = new Set([...Object.keys(currentGrouped), ...Object.keys(priorGrouped)])

    const result = Array.from(allLineas)
      .map((nombre) => ({
        nombre,
        primaNeta: Math.round(currentGrouped[nombre] || 0),
        anioAnterior: Math.round(priorGrouped[nombre] || 0),
      }))
      .sort((a, b) => b.primaNeta - a.primaNeta)

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: "Failed to fetch", detail: message }, { status: 500 })
  }
}
