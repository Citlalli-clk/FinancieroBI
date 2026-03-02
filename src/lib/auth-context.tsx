"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "./supabase"
import type { UserRole } from "./types"
import type { User } from "@supabase/supabase-js"

interface AuthState {
  user: User | null
  role: UserRole | null
  gerenciaId: number | null
  vendedorId: number | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  role: null,
  gerenciaId: null,
  vendedorId: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [gerenciaId, setGerenciaId] = useState<number | null>(null)
  const [vendedorId, setVendedorId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchRole(userId: string) {
    const { data } = await supabase
      .from("user_roles")
      .select("role, gerencia_id, vendedor_id")
      .eq("auth_user_id", userId)
      .single()

    if (data) {
      setRole(data.role as UserRole)
      setGerenciaId(data.gerencia_id)
      setVendedorId(data.vendedor_id)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchRole(u.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        fetchRole(u.id)
      } else {
        setRole(null)
        setGerenciaId(null)
        setVendedorId(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    setGerenciaId(null)
    setVendedorId(null)
  }

  return (
    <AuthContext.Provider value={{ user, role, gerenciaId, vendedorId, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
