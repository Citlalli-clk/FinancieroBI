"use client"

import { useEffect, useState } from "react"

export function PageFooter({ showFootnote = false }: { showFootnote?: boolean }) {
  const [now, setNow] = useState("")
  useEffect(() => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, "0")
    setNow(`${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`)
  }, [])

  return (
    <footer className="mt-8 pt-4 border-t border-[#E5E7E9] bg-white px-4 py-3 flex items-center justify-between text-[10px] rounded-b">
      <div className="flex items-center gap-3">
        {/* ClickSEGUROS logo text */}
        <div className="text-[#E62800] font-black text-xs tracking-tight">
          Click<span className="text-[#041224]">SEGUROS</span>
        </div>
        {showFootnote && (
          <span className="text-[9px] text-[#CCD1D3] italic">
            * El total de la prima neta del año anterior está al corte del mismo periodo del año anterior
          </span>
        )}
      </div>
      <div className="text-[#CCD1D3] text-right leading-tight">
        <div>Fecha de actualización.</div>
        <div className="font-semibold text-[#041224]">{now}</div>
      </div>
    </footer>
  )
}
