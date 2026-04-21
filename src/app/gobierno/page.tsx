"use client"

import { useEffect, useState, useCallback } from "react"
import { PageTabs } from "@/components/page-tabs"
import { PageFooter } from "@/components/page-footer"
import { PeriodFilter } from "@/components/period-filter"
import { getLineasWithYoY } from "@/lib/queries"
import { roundByFirstDecimal } from "@/lib/rounding"

function fmt(v: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(roundByFirstDecimal(v))
}

export default function GobiernoPage() {
  const currentYear = String(new Date().getFullYear())
  const currentMonth = new Date().getMonth() + 1

  const [year, setYear] = useState(currentYear)
  const [periodos, setPeriodos] = useState<number[]>(Array.from({ length: currentMonth }, (_, i) => i + 1))

  const [totalPrima, setTotalPrima] = useState(0)
  const [totalPpto, setTotalPpto] = useState(0)
  const [totalAA, setTotalAA] = useState(0)


  const handleFilterChange = useCallback((newYear: string, newPeriodos: number[]) => {
    setYear(newYear)
    setPeriodos(newPeriodos)
  }, [])

  useEffect(() => {
    document.title = "Gobierno | CLK BI Dashboard"
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const lineasData = await getLineasWithYoY(periodos, year)

      if (cancelled) return

      const lineas = lineasData ?? []
      setTotalPrima(lineas.reduce((s, l) => s + l.primaNeta, 0))
      setTotalPpto(lineas.reduce((s, l) => s + l.presupuesto, 0))
      setTotalAA(lineas.reduce((s, l) => s + l.anioAnterior, 0))

    }

    load()

    return () => {
      cancelled = true
    }
  }, [year, periodos])

  const cumplimiento = totalPpto > 0 ? Math.round((totalPrima / totalPpto) * 1000) / 10 : 0
  const crecimiento = totalAA > 0 ? Math.round(((totalPrima - totalAA) / totalAA) * 1000) / 10 : 0

  return (
    <div className="min-h-screen bg-[#FAFAFA] px-3 py-4 flex flex-col">
      <div className="max-w-[1200px] mx-auto w-full flex flex-col flex-1">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-2 pt-3 md:pt-5 w-full gap-2 md:gap-0">
          <PageTabs />
          <PeriodFilter onFilterChange={handleFilterChange} />
        </div>

        <h1 className="text-sm font-bold text-[#111] font-lato mt-3 mb-2">Gobierno — Control Ejecutivo</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase font-semibold">Prima neta acumulada</p>
            <p className="text-xl font-black text-[#041224] mt-1 tabular-nums">{fmt(totalPrima)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase font-semibold">Cumplimiento vs presupuesto</p>
            <p className={`text-xl font-black mt-1 tabular-nums ${cumplimiento >= 100 ? "text-[#059669]" : cumplimiento >= 80 ? "text-amber-600" : "text-[#E62800]"}`}>
              {cumplimiento}%
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase font-semibold">Crecimiento vs año anterior</p>
            <p className={`text-xl font-black mt-1 tabular-nums ${crecimiento >= 0 ? "text-[#059669]" : "text-[#E62800]"}`}>
              {crecimiento >= 0 ? "+" : ""}{crecimiento}%
            </p>
          </div>
        </div>


        <PageFooter />
      </div>
    </div>
  )
}