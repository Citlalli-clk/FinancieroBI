"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Building2, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await signIn(email, password)
      router.push("/")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-clk-bg -m-6 lg:-m-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <Building2 className="w-10 h-10 text-clk-red" />
            <span className="text-3xl font-bold text-clk-dark font-lato">CLK</span>
          </div>
          <p className="text-sm text-clk-gray-medium">BI Dashboard — Iniciar sesión</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-clk-gray-light p-6 shadow-sm">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-clk-red">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-clk-dark mb-1.5">Correo electrónico</label>
            <input
              id="login-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-3 py-2 border border-clk-gray-light rounded-md text-sm focus:outline-none focus:border-clk-red"
              placeholder="usuario@clkseguros.com"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-clk-dark mb-1.5">Contraseña</label>
            <input
              id="login-password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-3 py-2 border border-clk-gray-light rounded-md text-sm focus:outline-none focus:border-clk-red"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-clk-red text-white rounded-md text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Iniciar sesión
          </button>
        </form>
      </div>
    </div>
  )
}
