export interface DashboardTallerStats {
  total_solicitudes: number;
  pendientes: number;
  aceptadas: number;
  completadas: number;
  total_tecnicos: number;
  tecnicos_disponibles: number;
}

export interface SolicitudPendienteTaller {
  id_asignacion: number;
  id_incidente: number;
  descripcion: string;
  id_categoria: number;
  id_prioridad: number;
  latitud: number;
  longitud: number;
  fecha: string;
  id_estado_asignacion: number;
}

export interface DashboardTallerResponse {
  stats: DashboardTallerStats;
  solicitudes_pendientes: SolicitudPendienteTaller[];
}