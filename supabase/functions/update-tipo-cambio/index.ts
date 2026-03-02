// Supabase Edge Function: update-tipo-cambio
// Fetches real exchange rates from open.er-api.com and upserts into tipo_cambio table
// Schedule: 8am, 1pm, 6pm Mexico time (via Supabase cron or external trigger)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

Deno.serve(async () => {
  try {
    // Fetch rates from free API (no key needed)
    const res = await fetch("https://open.er-api.com/v6/latest/MXN")
    if (!res.ok) throw new Error(`API returned ${res.status}`)

    const data = await res.json()
    const rates = data.rates

    // Convert: API gives rates FROM 1 MXN → we want MXN per 1 unit
    const usdMxn = Math.round((1 / rates.USD) * 10000) / 10000
    const dopMxn = Math.round((1 / rates.DOP) * 10000) / 10000

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { error } = await supabase
      .from("tipo_cambio")
      .upsert([
        { moneda: "USD", valor: usdMxn, fecha_actualizacion: new Date().toISOString() },
        { moneda: "DOP", valor: dopMxn, fecha_actualizacion: new Date().toISOString() },
      ], { onConflict: "moneda" })

    if (error) throw error

    return new Response(JSON.stringify({
      ok: true,
      usd: usdMxn,
      dop: dopMxn,
      updated: new Date().toISOString(),
    }), { headers: { "Content-Type": "application/json" } })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
