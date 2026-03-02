"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/", label: "Tacómetro" },
  { href: "/tabla-detalle", label: "Tabla detalle" },
  { href: "/compromisos", label: "Compromisos 2025" },
  { href: "/internacional", label: "Internacional" },
  { href: "/corporate", label: "Corporate" },
  { href: "/cobranza", label: "Convenios" },
]

interface PageTabsProps {
  alertCount?: number // Badge for Tabla detalle
}

export function PageTabs({ alertCount }: PageTabsProps) {
  const pathname = usePathname()

  return (
    <div className="flex items-center bg-white border-b border-[#E5E7E9] mb-3 -mx-3 -mt-3 px-3 lg:-mx-4 lg:-mt-4 lg:px-4">
      {TABS.map((tab, i) => {
        const active = pathname === tab.href
        const prevIsActive = i > 0 && pathname === TABS[i - 1].href
        const showSep = i > 0 && !active && !prevIsActive
        return (
          <div key={tab.href} className="flex items-center">
            {showSep ? (
              <span className="text-[#E5E7E9] text-[13px] select-none px-0.5">|</span>
            ) : i > 0 ? (
              <span className="px-0.5" />
            ) : null}
            <Link
              href={tab.href}
              className={cn(
                "px-2.5 py-2 text-[12px] transition-colors relative -mb-px whitespace-nowrap flex items-center gap-1",
                active
                  ? "text-[#041224] font-bold border-b-[3px] border-[#E62800]"
                  : "text-[#A0A0A0] hover:text-[#041224]"
              )}
            >
              {tab.label}
              {tab.href === "/tabla-detalle" && alertCount !== undefined && alertCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold bg-[#E62800] text-white rounded-full">
                  {alertCount}
                </span>
              )}
            </Link>
          </div>
        )
      })}
    </div>
  )
}
