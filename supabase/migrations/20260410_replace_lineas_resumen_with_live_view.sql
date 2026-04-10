BEGIN;

-- Defensive parser for numeric values coming from mixed text/number columns.
CREATE OR REPLACE FUNCTION public.parse_budget_text(input text)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  s text;
BEGIN
  s := COALESCE(input, '');
  s := regexp_replace(s, '[^0-9,.-]', '', 'g');

  IF s = '' OR s = '-' OR s = '.' THEN
    RETURN 0;
  END IF;

  IF position(',' in s) > 0 AND position('.' in s) > 0 THEN
    -- Typical input: 17,545.167 -> 17545.167
    s := replace(s, ',', '');
  ELSIF position(',' in s) > 0 AND position('.' in s) = 0 THEN
    -- Decimal comma fallback
    s := replace(s, ',', '.');
  END IF;

  RETURN COALESCE(s::numeric, 0);
EXCEPTION WHEN OTHERS THEN
  RETURN 0;
END;
$$;

-- Parse month from strings like:
-- - 3/25/26 0:00
-- - 3/25/2026
-- - 2026-03-25
CREATE OR REPLACE FUNCTION public.parse_month_text(input text)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  token text;
  m integer;
BEGIN
  token := split_part(trim(COALESCE(input, '')), ' ', 1);

  IF token = '' THEN
    RETURN NULL;
  END IF;

  IF token ~ '^\d{1,2}/\d{1,2}/\d{2,4}$' THEN
    m := split_part(token, '/', 1)::integer;
  ELSIF token ~ '^\d{1,2}/\d{1,2}$' THEN
    m := split_part(token, '/', 1)::integer;
  ELSIF token ~ '^\d{4}-\d{1,2}-\d{1,2}$' THEN
    m := EXTRACT(month FROM token::date)::integer;
  ELSE
    RETURN NULL;
  END IF;

  IF m BETWEEN 1 AND 12 THEN
    RETURN m;
  END IF;

  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_linea_name(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v text;
  normalized text;
BEGIN
  v := trim(COALESCE(input, ''));
  IF v = '' THEN
    RETURN 'Sin línea';
  END IF;

  normalized := translate(lower(v), 'áéíóúäëïöü', 'aeiouaeiou');

  IF normalized IN ('click promotorias', 'click promotoras') THEN
    RETURN 'Click Promotorías';
  END IF;

  RETURN v;
END;
$$;

DROP FUNCTION IF EXISTS public.refresh_lineas_resumen(integer);
DROP VIEW IF EXISTS public.lineas_resumen;
DROP TABLE IF EXISTS public.lineas_resumen;
DROP VIEW IF EXISTS public.vw_lineas_resumen_mensual;

CREATE OR REPLACE VIEW public.vw_lineas_resumen_mensual AS
WITH primas_base AS (
  SELECT
    2024::integer AS anio,
    COALESCE(
      public.parse_month_text("FLiquidacion"::text),
      CASE WHEN "Periodo" BETWEEN 1 AND 12 THEN "Periodo"::integer ELSE NULL END
    ) AS periodo,
    public.normalize_linea_name("LBussinesNombre") AS linea,
    public.parse_budget_text("PrimaNeta"::text) AS prima_neta,
    public.parse_budget_text("Descuento"::text) AS descuento,
    COALESCE(NULLIF(public.parse_budget_text("TCPago"::text), 0), 1) AS tc_pago
  FROM public.efectuada_2024_drive

  UNION ALL

  SELECT
    2025::integer AS anio,
    COALESCE(
      public.parse_month_text("FLiquidacion"::text),
      CASE WHEN "Periodo" BETWEEN 1 AND 12 THEN "Periodo"::integer ELSE NULL END
    ) AS periodo,
    public.normalize_linea_name("LBussinesNombre") AS linea,
    public.parse_budget_text("PrimaNeta"::text) AS prima_neta,
    public.parse_budget_text("Descuento"::text) AS descuento,
    COALESCE(NULLIF(public.parse_budget_text("TCPago"::text), 0), 1) AS tc_pago
  FROM public.efectuada_2025_drive

  UNION ALL

  SELECT
    2026::integer AS anio,
    COALESCE(
      public.parse_month_text("FLiquidacion"::text),
      CASE WHEN "Periodo" BETWEEN 1 AND 12 THEN "Periodo"::integer ELSE NULL END
    ) AS periodo,
    public.normalize_linea_name("LBussinesNombre") AS linea,
    public.parse_budget_text("PrimaNeta"::text) AS prima_neta,
    public.parse_budget_text("Descuento"::text) AS descuento,
    COALESCE(NULLIF(public.parse_budget_text("TCPago"::text), 0), 1) AS tc_pago
  FROM public.efectuada_2026_drive
),
primas_agg AS (
  SELECT
    anio,
    periodo,
    linea,
    SUM((COALESCE(prima_neta, 0) - COALESCE(descuento, 0)) * COALESCE(NULLIF(tc_pago, 0), 1)) AS prima_neta
  FROM primas_base
  WHERE periodo BETWEEN 1 AND 12
  GROUP BY 1, 2, 3
),
presupuesto_base AS (
  SELECT
    2026::integer AS anio,
    public.parse_month_text("Fecha"::text) AS periodo,
    public.normalize_linea_name("LBussinesNombre") AS linea,
    public.parse_budget_text("Presupuesto"::text) AS presupuesto
  FROM public.presupuestos_2026_drive
),
presupuesto_agg AS (
  SELECT
    anio,
    periodo,
    linea,
    SUM(COALESCE(presupuesto, 0)) AS presupuesto
  FROM presupuesto_base
  WHERE periodo BETWEEN 1 AND 12
  GROUP BY 1, 2, 3
),
pendiente_agg AS (
  SELECT
    EXTRACT(year FROM now())::integer AS anio,
    CASE WHEN "Periodo" BETWEEN 1 AND 12 THEN "Periodo"::integer ELSE NULL END AS periodo,
    public.normalize_linea_name("LBussinesNombre") AS linea,
    SUM(public.parse_budget_text("PrimaNeta"::text)) AS pendiente
  FROM public.pendiente_drive
  WHERE "Periodo" BETWEEN 1 AND 12
  GROUP BY 1, 2, 3
),
unioned AS (
  SELECT anio, periodo, linea, prima_neta, 0::numeric AS presupuesto, 0::numeric AS pendiente FROM primas_agg
  UNION ALL
  SELECT anio, periodo, linea, 0::numeric AS prima_neta, presupuesto, 0::numeric AS pendiente FROM presupuesto_agg
  UNION ALL
  SELECT anio, periodo, linea, 0::numeric AS prima_neta, 0::numeric AS presupuesto, pendiente FROM pendiente_agg
)
SELECT
  anio,
  periodo,
  linea,
  SUM(prima_neta)::numeric AS prima_neta,
  SUM(presupuesto)::numeric AS presupuesto,
  SUM(pendiente)::numeric AS pendiente,
  now() AS updated_at
FROM unioned
WHERE periodo BETWEEN 1 AND 12
  AND linea IN (
    'Click Franquicias',
    'Cartera Tradicional',
    'Click Promotorías',
    'Corporate',
    'Call Center'
  )
GROUP BY anio, periodo, linea;

-- Compatibility table for deployed API versions.
-- Rationale: old frontend/API path queries `lineas_resumen` directly and must be fast.
CREATE TABLE public.lineas_resumen (
  anio integer NOT NULL,
  periodo integer NOT NULL,
  linea text NOT NULL,
  prima_neta numeric NOT NULL DEFAULT 0,
  presupuesto numeric NOT NULL DEFAULT 0,
  pendiente numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (anio, periodo, linea)
);

CREATE INDEX lineas_resumen_anio_periodo_idx ON public.lineas_resumen (anio, periodo);

CREATE OR REPLACE FUNCTION public.refresh_lineas_resumen(p_anio integer DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_anio IS NULL THEN
    TRUNCATE TABLE public.lineas_resumen;

    INSERT INTO public.lineas_resumen (anio, periodo, linea, prima_neta, presupuesto, pendiente, updated_at)
    SELECT anio, periodo, linea, prima_neta, presupuesto, pendiente, now()
    FROM public.vw_lineas_resumen_mensual;
  ELSE
    DELETE FROM public.lineas_resumen WHERE anio = p_anio;

    INSERT INTO public.lineas_resumen (anio, periodo, linea, prima_neta, presupuesto, pendiente, updated_at)
    SELECT anio, periodo, linea, prima_neta, presupuesto, pendiente, now()
    FROM public.vw_lineas_resumen_mensual
    WHERE anio = p_anio;
  END IF;
END;
$$;

-- Seed summary table immediately.
SELECT public.refresh_lineas_resumen(NULL);

GRANT SELECT ON public.vw_lineas_resumen_mensual TO anon, authenticated, service_role;
GRANT SELECT ON public.lineas_resumen TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.refresh_lineas_resumen(integer) TO authenticated, service_role;

COMMIT;
