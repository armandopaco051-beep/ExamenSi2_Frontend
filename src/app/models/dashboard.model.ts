export interface DashboardStats {
  total_incidentes: number;
  pendientes: number;
  en_proceso: number;
  atendidos: number;
  total_talleres: number;
  tecnicos_disponibles: number;
  total_tecnicos: number;
  total_usuarios: number;
}

export interface DashboardIncidente {
  codigo: number;
  descripcion: string;
  id_categoria: number;
  id_prioridad: number;
  id_estado: number;
  fecha_reporte: string;
  latitud: number;
  longitud: number;
}

export interface DashboardActividad {
  id: number;
  accion: string;
  modulo: string;
  descripcion: string;
  usuario: string;
  fecha: string;
}

export interface DashboardTendencia {
  dia: string;
  fecha: string;
  total: number;
}

export interface DashboardTipoEmergencia {
  categoria: string;
  total: number;
}

export interface DashboardAdminResponse {
  stats: DashboardStats;
  ultimos_incidentes: DashboardIncidente[];
  actividad_reciente: DashboardActividad[];
  tendencia_semanal: DashboardTendencia[];
  tipo_emergencia: DashboardTipoEmergencia[];
}
