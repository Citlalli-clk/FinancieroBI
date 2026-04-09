import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let cachedClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Defensive fallback: avoid hard-crashing the entire UI (white screen)
    // when env vars are missing in a deployment.
    if (typeof window !== "undefined") {
      console.error("Missing Supabase client env vars: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY")
    }

    cachedClient = createClient("https://placeholder.supabase.co", "placeholder-anon-key")
    return cachedClient
  }

  cachedClient = createClient(supabaseUrl, supabaseAnonKey)
  return cachedClient
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseClient() as unknown as Record<string, unknown>
    return Reflect.get(client, prop, receiver)
  },
})
