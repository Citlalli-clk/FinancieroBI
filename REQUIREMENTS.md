# CLK BI Dashboard - Sprint Requirements

## Context
Insurance BI dashboard for Click Seguros (Javier Mitrani). Next.js + Supabase + Recharts + Tailwind.
Deploy: https://clk-bi-dashboard.vercel.app

## BLOCK 1: Fix Tacómetro (Gauge) — src/components/gauge.tsx + src/app/page.tsx
The gauge was deformed and colors/dimensions were wrong. Fix per Susan's reference:
- Semi-circular arc (~240°), NOT full circle
- Multi-color segments: green → yellow-green → yellow → orange → red (5-6 segments)
- Thin needle with circular hub at center bottom
- Large value text centered inside (e.g., "$98.5M")
- Scale markings at key positions
- Clean, flat modern design
- The gauge should NOT be too tall — it was taking too much vertical space
- The gauge currently shows "Prima neta cobrada" value

## BLOCK 2: Remove Redundant Buttons — src/app/page.tsx + src/app/tabla-detalle/page.tsx
- REMOVE the "Gobierno", "Grupo Click", "RD" buttons on the Tacómetro page (they were a workaround/patch)
- REMOVE the "Linea", "Gerencia", "Vendedor" tab/toggle buttons on the Tabla Detalle page (top right area)
- The breadcrumb navigation chain (clicking through drill-down levels) STAYS — that's what the client wants
- The breadcrumb is the ">" chain at the top left showing the drill-down path

## BLOCK 3: Optimize Whitespace — ALL pages
- Too much empty space in the current design
- Make the layout more compact and data-dense
- Reduce padding/margins where excessive
- Cards should use space efficiently
- The bar chart on the tacómetro page was too wide/long — constrain it

## BLOCK 4: Redesign Filters — src/app/tabla-detalle/page.tsx + all pages
Client wants this filter flow:
1. **Año** dropdown (2024, 2025, 2026...)
2. **Periodo** dropdown: Mes | Trimestre | Semestre | Acumulado
3. When "Mes" → show multi-select for months (Enero, Febrero, etc.)
4. When "Trimestre" → show Q1, Q2, Q3, Q4
5. When "Semestre" → show S1, S2
6. When "Acumulado" → Year-to-date vs previous year (no sub-selection needed)
- REMOVE the old "Comparar" / "Vs Año Anterior" dropdown
- This filter pattern should be consistent across ALL pages

## BLOCK 5: Graphs → Tables where appropriate
- For drill-down levels with many items (30+ for Franquicias), use tables not charts
- Keep the horizontal bar chart on the main tacómetro page for the 5 lines of business (it's useful at top level)
- But constrain its width — it was stretching too far

## Git Rules
- Author: santos-vulkn <santos@vulkn-ai.com>
- Commit after each block
- Push to origin main after each commit

## Supabase Connection
- URL: https://ktqelgafkywncetxiosd.supabase.co
- Anon Key: in src/lib/supabase.ts
- Queries in src/lib/queries.ts — DO NOT break existing query functions
- The data model uses views/tables for prima_neta, presupuesto, etc.

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Recharts for charts
- Supabase for data
- lucide-react for icons
