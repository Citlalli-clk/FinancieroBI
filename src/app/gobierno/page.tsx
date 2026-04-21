"use client"

import HomePage from "../page"

export default function GobiernoPage() {
  return (
    <div className="gobierno-scope">
      <HomePage />
      <style jsx global>{`
        /* Gobierno request: keep table structure, hide all business-line rows */
        .gobierno-scope table tbody tr {
          display: none;
        }
      `}</style>
    </div>
  )
}
