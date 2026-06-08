export interface Taller {
  codigo: number;
  nombre: string;
  telefono: string;
  direccion: string;
  latitud: number;
  longitud: number;
  activo: boolean;
  estado_registro: string;           // ✅ corregido
  observacion_admin?: string | null;
  fecha_solicitud?: string | null;
  fecha_respuesta?: string | null;
  horario_inicio?: string | null;
  horario_fin?: string | null;
  usuario_id?: string | null;
}

export interface TallerCreate {
  nombre: string;
  telefono: string;
  direccion: string;
  latitud: number;
  longitud: number;
  horario_inicio?: string;
  horario_fin?: string;
  usuario_id?: string;
}

export interface Tecnico {
  codigo: number;
  nombre: string;
  disponibilidad: boolean;
  latitud: number;
  longitud: number;
  telefono: string;
  id_taller: number;
}

export interface CoberturaTaller {
  codigo_taller?: number;
  radio_km: number;
  activo: boolean;
  latitud?: number;
  longitud?: number;
  nombre_taller?: string;
}

export interface CoberturaUpdate {
  codigo_taller: number;
  nombre_taller: string;
  latitud: number;
  longitud: number;
  radio_cobertura_km: number;
}

export interface CoberturaVerificacion {
  dentro_cobertura: boolean;
  distancia_km?: number;
  radio_km?: number;
  mensaje?: string;
}
