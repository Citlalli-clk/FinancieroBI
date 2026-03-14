# CKL BI Dashboard — Visual Polish Brief

## CRITICAL RULES
1. DO NOT change any component structure, layout proportions, or JavaScript logic
2. DO NOT change column widths (55/45 split on tacómetro, etc.)
3. DO NOT touch Corporate page at all
4. ONLY change: Tailwind classes (colors, fonts, padding, opacity), CSS styles
5. The ONE exception: fix the Total row in tabla-detalle levels 2-5 to show actual column sums instead of "—"

## CKL Brand Manual Colors
- Primary: #041224 (dark navy) — USE ONLY for table headers and Total row. Use opacity 60-80% for secondary elements
- Primary: #E62800 (red) — ONLY for negative numbers and alert indicators. Max 15% of visual
- Complementary: #E5E7E9 (light gray) — For alternating row backgrounds
- Complementary: #CCD1D3 (medium gray) — For borders, secondary text

## CKL Brand Fonts
- Lato — For titles and high-hierarchy text (import from Google Fonts)
- Body text — Keep current font, just ensure proper weight hierarchy

## Susan's Feedback: "Veo mucho negro"
- Reduce #041224 usage: only table headers + Total row at 100%
- Breadcrumb bars, filter areas, secondary elements → use lighter variants or gray backgrounds
- Alternating rows → use #E5E7E9 at 30% opacity instead of bg-gray-50

## What to Fix — In Order

### 1. Tabla Detalle (src/app/tabla-detalle/page.tsx)

#### 1A: Total Row Sumatorias (levels 2-5)
The Total row for gerencia/vendedor/grupo/cliente currently shows "—" for all columns except Prima Neta.
Fix: sum presupuesto, diferencia, pctDifPpto, pnAnioAnt, difYoY, pctDifYoY, pendiente from filteredRows.
Look at how level "linea" does it (totalLineas object) and replicate that pattern.

#### 1B: Visual Hierarchy
- Table headers: keep #041224 bg, keep text-xs, keep uppercase
- Data cells: already text-sm — ensure font-bold on numbers, font-semibold on names
- Secondary columns (Presupuesto, Pendiente): use text-gray-600 not text-gray-300
- Negative numbers: text-[#E62800] font-bold (already mostly done)
- Alternating rows: change bg-[#FAFBFC] → bg-[#E5E7E9]/30 (CKL manual gray)

#### 1C: Detail Drill Table (src/components/detail-drill-table.tsx)
This component uses text-xs everywhere and py-1.5 padding.
- Body data: text-xs → text-sm, font-medium → font-bold on numbers
- Row padding: py-1.5 → py-2
- Header bar: keep #041224 but reduce padding slightly
- Make it feel like a natural extension of the main table above
- Add whitespace-nowrap on name columns to prevent wrapping

#### 1D: Drill Charts (src/components/drill-charts.tsx)
- Axis labels: fontSize 11 → 13
- Bar labels: fontSize 11 → 13, fontWeight 600 → 700
- Legend text: increase to 13px
- Bar size: if currently small, increase slightly (14 → 16)
- Use MORE contrasting colors for distribution charts (Susan: "los tres colores estaban muy parecidos")

### 2. DO NOT TOUCH
- src/app/page.tsx (Tacómetro) — APPROVED, locked
- src/app/corporate/page.tsx — FROZEN per Susan
- Any query functions in src/lib/
- Component structure or props
- Export functions
- Filter logic

## Quality Standard
This is for a $1M+ insurance company executive dashboard. Every pixel matters.
Think Looker, Google Analytics, Stripe Dashboard level quality.
