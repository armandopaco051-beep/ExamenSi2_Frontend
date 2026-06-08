export type EstadoSuscripcion = 'ACTIVA' | 'VENCIDA' | 'SUSPENDIDA' | 'CANCELADA' | 'PENDIENTE_PAGO';

export interface PlanSuscripcion {
  id: number;
  nombre: string;
  duracion_dias: number;
  precio: number;
  dominio_incluido?: boolean;
  dominio_personalizado?: boolean;
  estado?: string;
  limite_talleres?: number;
  limite_tecnicos?: number;
  limite_usuarios?: number;
  limite_incidentes_mensuales?: number;
  limite_notificaciones_push?: number;
  limite_almacenamiento_gb?: number;
  caracteristicas?: string[] | string;
  descripcion?: string;
}

export interface DominioTenant {
  dominio: string;
  tipo?: string;
  estado?: string;
}

export interface SuscripcionActual {
  plan?: PlanSuscripcion;
  estado?: EstadoSuscripcion | string;
  fecha_inicio?: string;
  fecha_vencimiento?: string;
}

export interface TenantSuscripcion {
  id: number;
  nombre: string;
  slug: string;
  id_taller: number;
  estado: string;
  fecha_creacion?: string;
  dominio?: string | DominioTenant;
  estado_dominio?: string;
  id_suscripcion?: number;
  estado_suscripcion?: EstadoSuscripcion | string;
  fecha_inicio?: string;
  fecha_vencimiento?: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  plan?: PlanSuscripcion;
  suscripcion?: SuscripcionActual;
}

export interface CuotaValores {
  talleres: number;
  tecnicos: number;
  usuarios: number;
  incidentes_mensuales: number;
  notificaciones_push: number;
  almacenamiento_gb: number;
}

export interface CuotasTenant {
  id_tenant: number;
  id_taller: number;
  periodo: string;
  estado_suscripcion: string;
  fecha_vencimiento: string;
  limites: CuotaValores;
  consumo: CuotaValores;
  excedidos: Record<keyof CuotaValores, boolean>;
}

export interface CrearTenantPayload {
  nombre: string;
  slug: string;
  dominio: string;
  id_taller: number;
  tipo_dominio: 'SUBDOMINIO' | 'PERSONALIZADO';
}

export interface CheckoutSuscripcionPayload {
  success_url: string;
  cancel_url: string;
}

export interface CheckoutSuscripcionResponse {
  checkout_session_id: string;
  checkout_url: string;
  id_tenant: number;
  id_suscripcion: number;
  estado_suscripcion: EstadoSuscripcion | string;
}

export interface PagoSuscripcion {
  id?: number;
  id_pago?: number;
  id_suscripcion?: number;
  monto: number;
  moneda?: string;
  estado: string;
  fecha_pago?: string;
  fecha_creacion?: string;
  hosted_invoice_url?: string | null;
  invoice_pdf?: string | null;
  id_comprobante?: number | null;
}

export interface ComprobanteSuscripcion {
  id?: number;
  id_comprobante?: number;
  numero_comprobante?: string;
  fecha_emision?: string;
  monto?: number;
  total?: number;
  moneda?: string;
  estado?: string;
  detalle?: any;
  hosted_invoice_url?: string | null;
  invoice_pdf?: string | null;
}
