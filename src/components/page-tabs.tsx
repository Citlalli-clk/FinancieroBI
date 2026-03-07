"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const TABS = [
  { href: "/", label: "Tacómetro" },
  { href: "/tabla-detalle", label: "Tabla detalle" },
  { href: "/compromisos", label: "Vendedores" },
  { href: "/internacional", label: "Aseguradoras" },
  { href: "/corporate", label: "Corporate" },
  { href: "/cobranza", label: "Convenios" },
]

export function PageTabs() {
  const pathname = usePathname()

  return (
    <div className="flex items-center overflow-x-auto scrollbar-hide -mx-1 px-1 gap-0 md:gap-0">
      {TABS.map((tab, i) => (
        <React.Fragment key={tab.href}>
          {i > 0 && <span className="text-gray-300 mx-1 md:mx-2 flex-shrink-0">|</span>}
          <Link href={tab.href} className={`text-xs md:text-sm tracking-wide font-medium whitespace-nowrap py-2 px-1 md:px-0 flex-shrink-0 ${pathname === tab.href ? "text-gray-900 font-bold" : "text-gray-500 hover:text-gray-700"}`}>
            {tab.label}
          </Link>
        </React.Fragment>
      ))}
    </div>
  )
}
