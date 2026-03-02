"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn, formatCurrency, formatNumber, formatPercentage } from "@/lib/utils"

interface KPICardProps {
  title: string
  value: number
  subtitle?: string
  trend?: { value: number; isPositive: boolean }
  icon?: React.ReactNode
  format?: "currency" | "number" | "percentage"
  loading?: boolean
  onClick?: () => void
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon,
  format = "number",
  loading = false,
  onClick,
}: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (loading) return
    const duration = 800
    const steps = 30
    const increment = value / steps
    let current = 0
    let step = 0
    const timer = setInterval(() => {
      step++
      current = Math.min(current + increment, value)
      setDisplayValue(current)
      if (step >= steps) {
        setDisplayValue(value)
        clearInterval(timer)
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value, loading])

  const formatted =
    format === "currency"
      ? formatCurrency(displayValue)
      : format === "percentage"
        ? formatPercentage(displayValue)
        : formatNumber(Math.round(displayValue))

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-clk-gray-light p-5 animate-pulse">
        <div className="h-4 bg-clk-gray-light rounded w-1/2 mb-3" />
        <div className="h-8 bg-clk-gray-light rounded w-3/4 mb-2" />
        <div className="h-3 bg-clk-gray-light rounded w-1/3" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-clk-gray-light p-5 transition-all",
        onClick && "cursor-pointer hover:shadow-md hover:border-clk-gray-medium"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-clk-gray-medium font-medium uppercase tracking-wide">
          {title}
        </span>
        {icon && <span className="text-clk-gray-medium">{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-clk-dark font-lato">{formatted}</div>
      <div className="flex items-center gap-2 mt-1">
        {trend && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-semibold",
              trend.isPositive ? "text-green-600" : "text-clk-red"
            )}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {trend.value > 0 ? "+" : ""}
            {trend.value.toFixed(1)}%
          </span>
        )}
        {subtitle && (
          <span className="text-xs text-clk-gray-medium">{subtitle}</span>
        )}
      </div>
    </div>
  )
}
