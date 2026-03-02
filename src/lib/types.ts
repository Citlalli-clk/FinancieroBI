// ============ Dimension Types ============

export interface DimTiempo {
  id: number
  fecha: string
  anio: number
  trimestre: number
  mes: number
  semana: number
  dia_semana: number
  nombre_mes: string
  nombre_trimestre: string
}

export interface DimLineaNegocio {
  id: number
  nombre: string
  descripcion?: string
}

export interface DimGerencia {
  id: number
  nombre: string
  linea_negocio_id?: number
}

export interface DimVendedor {
  id: number
  nombre: string
  email?: string
  gerencia_id?: number
  activo: boolean
  auth_user_id?: string
}

export interface DimGrupo {
  id: number
  nombre: string
  vendedor_id?: number
}

export interface DimCliente {
  id: number
  nombre: string
  rfc?: string
  grupo_id?: number
}

export interface DimAseguradora {
  id: number
  nombre: string
  nombre_corto?: string
  logo_url?: string
}

export interface DimRamo {
  id: number
  nombre: string
  descripcion?: string
}

// ============ Fact Types ============

export interface FactPrima {
  id: number
  tiempo_id: number
  linea_negocio_id: number
  gerencia_id: number
  vendedor_id: number
  grupo_id?: number
  cliente_id: number
  aseguradora_id: number
  ramo_id: number
  no_poliza: string
  tipo_movimiento: "emision" | "renovacion" | "endoso" | "cancelacion" | "devolucion"
  fecha_emision?: string
  fecha_inicio_vigencia?: string
  fecha_fin_vigencia?: string
  fecha_liquidacion: string
  prima_neta: number
  prima_neta_cobrada: number
  descuento: number
  tipo_de_cambio: number
  prima_cobrada_calculada: number
  comision_porcentaje: number
  comision_monto: number
  moneda: string
  created_at: string
}

export interface FactCobranza {
  id: number
  tiempo_id: number
  cliente_id: number
  vendedor_id: number
  aseguradora_id: number
  no_poliza: string
  recibo_numero?: string
  monto_total: number
  monto_pagado: number
  saldo_pendiente: number
  fecha_vencimiento: string
  fecha_pago?: string
  estatus: "pendiente" | "pagado" | "vencido" | "cancelado"
  dias_mora: number
  created_at: string
}

export interface Meta {
  id: number
  anio: number
  mes: number
  nivel: "linea_negocio" | "gerencia" | "vendedor" | "grupo" | "cliente"
  nivel_id: number
  meta_prima: number
  meta_cobranza: number
  created_at: string
}

// ============ Auth Types ============

export type UserRole = "director" | "gerente" | "vendedor"

export interface UserRoleRecord {
  id: number
  auth_user_id: string
  role: UserRole
  gerencia_id?: number
  vendedor_id?: number
}
