export interface TecnicoDashboardResumen {
  activos: number;
  finalizados: number;
  hoy: number;
  calificacion: number;
  tecnico ?: {
    codigo:string  ; 
    nombre :string ; 
    telefono:string ;
    disponibilidad : string ; 
    id_taller: number; 
  }
}

export interface IncidenteTecnicoActual {
  id_asignacion: number;
  id_incidente: number;
  categoria: string;
  descripcion: string;
  cliente: string;
  telefono: string;
  fecha: string;
  estado: string;
  latitud: number;
  longitud: number;
}

export interface HistorialTecnicoItem {
  id_incidente: number;
  categoria: string;
  cliente: string;
  fecha: string;
  estado: string;
}