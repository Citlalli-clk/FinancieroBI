# Vista viva de líneas (`vw_lineas_resumen_mensual`)

## Objetivo
Reemplazar la tabla precalculada `lineas_resumen` por una capa **viva** (vista SQL) para que el cálculo mensual se actualice en tiempo real y respete la semántica correcta de 2026.

---

## Qué se cambió

### 1) Reemplazo estructural
- Se elimina la lógica legacy de refresco manual:
  - `DROP FUNCTION IF EXISTS public.refresh_lineas_resumen(integer)`
  - `DROP TABLE IF EXISTS public.lineas_resumen`
- Se crea la vista viva:
  - `public.vw_lineas_resumen_mensual`

### 2) Compatibilidad con despliegues viejos
Como producción seguía leyendo `lineas_resumen`, se dejó un alias compatible:
- `CREATE OR REPLACE VIEW public.lineas_resumen AS SELECT ... FROM public.vw_lineas_resumen_mensual`

Con esto:
- ya **no existe tabla materializada**,
- y el endpoint viejo no se rompe mientras se despliega el código nuevo.

### 3) Regla crítica 2026 (causa de la discrepancia)
Para `efectuada_2026_drive`, el mes se calcula por `FLiquidacion` (no por `Periodo`), soportando formatos como:
- `MM/DD/YY HH:MI` (ej. `3/25/26 0:00`)
- `YYYY-MM-DD`

Si no se puede interpretar `FLiquidacion`, cae a `Periodo` como fallback defensivo.

### 4) Fórmula oficial
`prima_neta = (PrimaNeta - Descuento) * TCPago`

### 5) Scope de líneas del tacómetro
La vista filtra explícitamente a las líneas del KPI:
- `Click Franquicias`
- `Cartera Tradicional`
- `Click Promotorías` / `Click Promotoras`
- `Corporate`
- `Call Center`

Esto evita mezclar líneas fuera del tacómetro (p. ej. Gobierno) en el total principal.

### 6) Presupuestos disponibles en esta BD
En el entorno actual solo existe `Presupuestos 2026`; por eso la parte de presupuesto de la vista se construye con esa tabla.

---

## Archivo de migración
- `supabase/migrations/20260410_replace_lineas_resumen_with_live_view.sql`

---

## Validación recomendada

### 1) Total marzo 2026 desde la vista
```sql
SELECT
  SUM(prima_neta) AS total_marzo_2026
FROM public.vw_lineas_resumen_mensual
WHERE anio = 2026
  AND periodo = 3;
```
Esperado actual: ~`123,265,505` (≈ `123.3M`).

### 2) Desglose marzo 2026
```sql
SELECT
  linea,
  SUM(prima_neta) AS prima_neta
FROM public.vw_lineas_resumen_mensual
WHERE anio = 2026
  AND periodo = 3
GROUP BY linea
ORDER BY prima_neta DESC;
```

### 3) Verificación API productiva
```bash
curl -s "https://financiero-bi-dashboard.vercel.app/api/lineas?year=2026&meses=3" -D - | head
```
Header esperado (build viejo):
- `x-lineas-source: summary`

Header esperado (build nuevo con `route.ts` actualizado):
- `x-lineas-source: summary:vw_lineas_resumen_mensual`
