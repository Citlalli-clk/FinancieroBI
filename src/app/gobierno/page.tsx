"use client"

import { useEffect, useState, useCallback } from "react"
import { PageTabs } from "@/components/page-tabs"
import { PageFooter } from "@/components/page-footer"
import { PeriodFilter } from "@/components/period-filter"

export default function GobiernoPage() {
  const currentYear = String(new Date().getFullYear())
  const currentMonth = new Date().getMonth() + 1

  const [year, setYear] = useState(currentYear)
  const [periodos, setPeriodos] = useState<number[]>(Array.from({ length: currentMonth }, (_, i) => i + 1))


  const handleFilterChange = useCallback((newYear: string, newPeriodos: number[]) => {
    setYear(newYear)
    setPeriodos(newPeriodos)
  }, [])

  useEffect(() => {
    document.title = "Gobierno | CLK BI Dashboard"
  }, [])


  return (
    <div className="min-h-screen bg-[#FAFAFA] px-3 py-4 flex flex-col">
      <div className="max-w-[1200px] mx-auto w-full flex flex-col flex-1">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-2 pt-3 md:pt-5 w-full gap-2 md:gap-0">
          <PageTabs />
          <PeriodFilter onFilterChange={handleFilterChange} />
        </div>

        <PageFooter />
      </div>
    </div>
  )
}