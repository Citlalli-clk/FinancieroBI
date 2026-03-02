-- ============================================================
-- CLK BI Dashboard — Star Schema
-- Schema: bi_dashboard (isolated from public)
-- ============================================================

CREATE SCHEMA IF NOT EXISTS bi_dashboard;

-- ============ DIMENSION TABLES ============

CREATE TABLE bi_dashboard.dim_tiempo (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE,
  anio INT NOT NULL,
  trimestre INT NOT NULL,
  mes INT NOT NULL,
  semana INT NOT NULL,
  dia_semana INT NOT NULL,
  nombre_mes TEXT NOT NULL,
  nombre_trimestre TEXT NOT NULL
);

CREATE TABLE bi_dashboard.dim_linea_negocio (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT
);

CREATE TABLE bi_dashboard.dim_gerencia (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  linea_negocio_id INT REFERENCES bi_dashboard.dim_linea_negocio(id)
);

CREATE TABLE bi_dashboard.dim_vendedor (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT,
  gerencia_id INT REFERENCES bi_dashboard.dim_gerencia(id),
  activo BOOLEAN DEFAULT true,
  auth_user_id UUID REFERENCES auth.users(id)
);

CREATE TABLE bi_dashboard.dim_grupo (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  vendedor_id INT REFERENCES bi_dashboard.dim_vendedor(id)
);

CREATE TABLE bi_dashboard.dim_cliente (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  rfc TEXT,
  grupo_id INT REFERENCES bi_dashboard.dim_grupo(id)
);

CREATE TABLE bi_dashboard.dim_aseguradora (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  nombre_corto TEXT,
  logo_url TEXT
);

CREATE TABLE bi_dashboard.dim_ramo (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT
);

-- ============ FACT TABLES ============

CREATE TABLE bi_dashboard.fact_primas (
  id BIGSERIAL PRIMARY KEY,
  tiempo_id INT NOT NULL REFERENCES bi_dashboard.dim_tiempo(id),
  linea_negocio_id INT NOT NULL REFERENCES bi_dashboard.dim_linea_negocio(id),
  gerencia_id INT NOT NULL REFERENCES bi_dashboard.dim_gerencia(id),
  vendedor_id INT NOT NULL REFERENCES bi_dashboard.dim_vendedor(id),
  grupo_id INT REFERENCES bi_dashboard.dim_grupo(id),
  cliente_id INT NOT NULL REFERENCES bi_dashboard.dim_cliente(id),
  aseguradora_id INT NOT NULL REFERENCES bi_dashboard.dim_aseguradora(id),
  ramo_id INT NOT NULL REFERENCES bi_dashboard.dim_ramo(id),
  no_poliza TEXT NOT NULL,
  tipo_movimiento TEXT NOT NULL CHECK (tipo_movimiento IN (
    'emision', 'renovacion', 'endoso', 'cancelacion', 'devolucion'
  )),
  fecha_emision DATE,
  fecha_inicio_vigencia DATE,
  fecha_fin_vigencia DATE,
  fecha_liquidacion DATE NOT NULL,
  prima_neta NUMERIC(14,2) NOT NULL DEFAULT 0,
  prima_neta_cobrada NUMERIC(14,2) NOT NULL DEFAULT 0,
  descuento NUMERIC(14,2) NOT NULL DEFAULT 0,
  tipo_de_cambio NUMERIC(10,4) NOT NULL DEFAULT 1.0,
  -- FÓRMULA OFICIAL: (prima_neta_cobrada - descuento) * tipo_de_cambio
  prima_cobrada_calculada NUMERIC(14,2) GENERATED ALWAYS AS (
    (prima_neta_cobrada - descuento) * tipo_de_cambio
  ) STORED,
  comision_porcentaje NUMERIC(5,2) DEFAULT 0,
  comision_monto NUMERIC(14,2) DEFAULT 0,
  moneda TEXT DEFAULT 'MXN',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE bi_dashboard.fact_cobranza (
  id BIGSERIAL PRIMARY KEY,
  tiempo_id INT NOT NULL REFERENCES bi_dashboard.dim_tiempo(id),
  cliente_id INT NOT NULL REFERENCES bi_dashboard.dim_cliente(id),
  vendedor_id INT NOT NULL REFERENCES bi_dashboard.dim_vendedor(id),
  aseguradora_id INT NOT NULL REFERENCES bi_dashboard.dim_aseguradora(id),
  no_poliza TEXT NOT NULL,
  recibo_numero TEXT,
  monto_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  monto_pagado NUMERIC(14,2) NOT NULL DEFAULT 0,
  saldo_pendiente NUMERIC(14,2) GENERATED ALWAYS AS (monto_total - monto_pagado) STORED,
  fecha_vencimiento DATE NOT NULL,
  fecha_pago DATE,
  estatus TEXT NOT NULL DEFAULT 'pendiente' CHECK (estatus IN (
    'pendiente', 'pagado', 'vencido', 'cancelado'
  )),
  dias_mora INT GENERATED ALWAYS AS (
    CASE WHEN fecha_pago IS NULL AND current_date > fecha_vencimiento
      THEN current_date - fecha_vencimiento
      ELSE 0
    END
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE bi_dashboard.metas (
  id SERIAL PRIMARY KEY,
  anio INT NOT NULL,
  mes INT NOT NULL,
  nivel TEXT NOT NULL CHECK (nivel IN (
    'linea_negocio', 'gerencia', 'vendedor', 'grupo', 'cliente'
  )),
  nivel_id INT NOT NULL,
  meta_prima NUMERIC(14,2) NOT NULL DEFAULT 0,
  meta_cobranza NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(anio, mes, nivel, nivel_id)
);

-- ============ USER ROLES ============

CREATE TABLE bi_dashboard.user_roles (
  id SERIAL PRIMARY KEY,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('director', 'gerente', 'vendedor')),
  gerencia_id INT REFERENCES bi_dashboard.dim_gerencia(id),
  vendedor_id INT REFERENCES bi_dashboard.dim_vendedor(id),
  UNIQUE(auth_user_id)
);

-- ============ INDEXES ============

-- fact_primas: high-volume queries by date, hierarchy, policy
CREATE INDEX idx_fp_tiempo ON bi_dashboard.fact_primas(tiempo_id);
CREATE INDEX idx_fp_fecha_liq ON bi_dashboard.fact_primas(fecha_liquidacion);
CREATE INDEX idx_fp_gerencia ON bi_dashboard.fact_primas(gerencia_id);
CREATE INDEX idx_fp_vendedor ON bi_dashboard.fact_primas(vendedor_id);
CREATE INDEX idx_fp_linea ON bi_dashboard.fact_primas(linea_negocio_id);
CREATE INDEX idx_fp_aseguradora ON bi_dashboard.fact_primas(aseguradora_id);
CREATE INDEX idx_fp_ramo ON bi_dashboard.fact_primas(ramo_id);
CREATE INDEX idx_fp_poliza ON bi_dashboard.fact_primas(no_poliza);
CREATE INDEX idx_fp_cliente ON bi_dashboard.fact_primas(cliente_id);

-- fact_cobranza: queries by status, date, vendor
CREATE INDEX idx_fc_vencimiento ON bi_dashboard.fact_cobranza(fecha_vencimiento);
CREATE INDEX idx_fc_estatus ON bi_dashboard.fact_cobranza(estatus);
CREATE INDEX idx_fc_vendedor ON bi_dashboard.fact_cobranza(vendedor_id);
CREATE INDEX idx_fc_cliente ON bi_dashboard.fact_cobranza(cliente_id);

-- metas: lookup by period + level
CREATE INDEX idx_metas_periodo ON bi_dashboard.metas(anio, mes);

-- ============ RLS ============

ALTER TABLE bi_dashboard.fact_primas ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_dashboard.fact_cobranza ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_dashboard.metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_dashboard.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_dashboard.dim_tiempo ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_dashboard.dim_linea_negocio ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_dashboard.dim_gerencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_dashboard.dim_vendedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_dashboard.dim_grupo ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_dashboard.dim_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_dashboard.dim_aseguradora ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_dashboard.dim_ramo ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role info
CREATE OR REPLACE FUNCTION bi_dashboard.get_user_role()
RETURNS TABLE(role TEXT, gerencia_id INT, vendedor_id INT)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT ur.role, ur.gerencia_id, ur.vendedor_id
  FROM bi_dashboard.user_roles ur
  WHERE ur.auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- ---- fact_primas policies ----

CREATE POLICY director_primas ON bi_dashboard.fact_primas FOR SELECT USING (
  EXISTS (SELECT 1 FROM bi_dashboard.user_roles WHERE auth_user_id = auth.uid() AND role = 'director')
);

CREATE POLICY gerente_primas ON bi_dashboard.fact_primas FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bi_dashboard.user_roles ur
    WHERE ur.auth_user_id = auth.uid()
      AND ur.role = 'gerente'
      AND ur.gerencia_id = fact_primas.gerencia_id
  )
);

CREATE POLICY vendedor_primas ON bi_dashboard.fact_primas FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bi_dashboard.user_roles ur
    WHERE ur.auth_user_id = auth.uid()
      AND ur.role = 'vendedor'
      AND ur.vendedor_id = fact_primas.vendedor_id
  )
);

-- ---- fact_cobranza policies ----

CREATE POLICY director_cobranza ON bi_dashboard.fact_cobranza FOR SELECT USING (
  EXISTS (SELECT 1 FROM bi_dashboard.user_roles WHERE auth_user_id = auth.uid() AND role = 'director')
);

CREATE POLICY gerente_cobranza ON bi_dashboard.fact_cobranza FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bi_dashboard.user_roles ur
    JOIN bi_dashboard.dim_vendedor v ON v.id = fact_cobranza.vendedor_id
    WHERE ur.auth_user_id = auth.uid()
      AND ur.role = 'gerente'
      AND ur.gerencia_id = v.gerencia_id
  )
);

CREATE POLICY vendedor_cobranza ON bi_dashboard.fact_cobranza FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bi_dashboard.user_roles ur
    WHERE ur.auth_user_id = auth.uid()
      AND ur.role = 'vendedor'
      AND ur.vendedor_id = fact_cobranza.vendedor_id
  )
);

-- ---- metas policies ----

CREATE POLICY director_metas ON bi_dashboard.metas FOR SELECT USING (
  EXISTS (SELECT 1 FROM bi_dashboard.user_roles WHERE auth_user_id = auth.uid() AND role = 'director')
);

CREATE POLICY gerente_metas ON bi_dashboard.metas FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bi_dashboard.user_roles ur
    WHERE ur.auth_user_id = auth.uid()
      AND ur.role = 'gerente'
      AND (
        (metas.nivel = 'gerencia' AND metas.nivel_id = ur.gerencia_id)
        OR (metas.nivel = 'vendedor' AND metas.nivel_id IN (
          SELECT id FROM bi_dashboard.dim_vendedor WHERE gerencia_id = ur.gerencia_id
        ))
      )
  )
);

CREATE POLICY vendedor_metas ON bi_dashboard.metas FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bi_dashboard.user_roles ur
    WHERE ur.auth_user_id = auth.uid()
      AND ur.role = 'vendedor'
      AND metas.nivel = 'vendedor'
      AND metas.nivel_id = ur.vendedor_id
  )
);

-- ---- user_roles: own record only ----
CREATE POLICY own_role ON bi_dashboard.user_roles FOR SELECT USING (auth_user_id = auth.uid());

-- ---- dimensions: all authenticated users ----
CREATE POLICY read_tiempo ON bi_dashboard.dim_tiempo FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY read_linea ON bi_dashboard.dim_linea_negocio FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY read_gerencia ON bi_dashboard.dim_gerencia FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY read_vendedor ON bi_dashboard.dim_vendedor FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY read_grupo ON bi_dashboard.dim_grupo FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY read_cliente ON bi_dashboard.dim_cliente FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY read_aseguradora ON bi_dashboard.dim_aseguradora FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY read_ramo ON bi_dashboard.dim_ramo FOR SELECT USING (auth.uid() IS NOT NULL);
