export type EstadoCotizacion =
  | 'INVITADA'
  | 'ENVIADA'
  | 'ACEPTADA'
  | 'RECHAZADA'
  | 'VENCIDA'
  | 'AJUSTE_SOLICITADO'
  | 'RETIRADA';

export interface SolicitudCotizacion {
  id?: number;
  codigo?: number;
  id_solicitud?: number;
  id_incidente?: number;
  estado?: EstadoCotizacion | string;
  distancia_km?: number;
  fecha_limite?: string;
  fecha_vencimiento?: string;
  fecha_invitacion?: string;
  fecha_respuesta?: string;
  latitud?: number;
  longitud?: number;
  direccion?: string;
  descripcion?: string;
  categoria?: string;
  prioridad?: string;
  monto_estimado?: number;
  tiempo_llegada_minutos?: number;
  tiempo_reparacion_minutos?: number;
  descripcion_servicio?: string;
  id_tecnico?: string | null;
  observacion?: string;
  solicitud?: {
    id?: number;
    id_incidente?: number;
    ronda?: number;
    estado?: EstadoCotizacion | string;
    fecha_vencimiento?: string;
    fecha_limite?: string;
  };
  cotizacion?: {
    id?: number;
    id_solicitud?: number;
    id_taller?: number;
    id_tecnico?: string | null;
    estado?: EstadoCotizacion | string;
    distancia_km?: number;
    monto_estimado?: number;
    tiempo_llegada_minutos?: number;
    tiempo_reparacion_minutos?: number;
    descripcion_servicio?: string;
    observacion?: string;
    fecha_invitacion?: string;
    fecha_respuesta?: string;
    fecha_vencimiento?: string;
  };
  incidente?: {
    codigo?: number;
    id?: number;
    id_incidente?: number;
    descripcion?: string;
    latitud?: number;
    longitud?: number;
    direccion?: string;
    categoria?: string;
    id_categoria_problema?: number;
    prioridad?: string;
    id_prioridad?: number;
    fecha_reporte?: string;
  };
}

export interface ResponderCotizacionPayload {
  monto_estimado: number;
  tiempo_llegada_minutos: number;
  tiempo_reparacion_minutos: number;
  descripcion_servicio: string;
  id_tecnico: string | null;
  observacion?: string;
}

export interface RechazarCotizacionPayload {
  observacion: string;
}
