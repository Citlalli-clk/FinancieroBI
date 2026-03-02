import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ktqelgafkywncetxiosd.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0cWVsZ2Fma3l3bmNldHhpb3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NTU5MzUsImV4cCI6MjA4NzAzMTkzNX0.X336JIssmBnacUEx6lSqj-D-aNhv5JvSqpUVupQFHkA"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
