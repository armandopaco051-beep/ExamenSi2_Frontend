export interface Tecnico {
  codigo: string;
  nombre: string;
  email: string;
  disponibilidad: boolean;
  latitud: number;
  longitud: number;
  telefono: string;
  id_taller: number;
  id_rol: number;
}

export interface TecnicoCreate {
  codigo: string;
  nombre: string;
  telefono : string; 
  disponibilidad: boolean;
  latitud?: number;
  longitud?: number;
  id_taller?: number;
}

export interface TecnicoUpdate {
  nombre?: string;
  disponibilidad?: boolean;
  latitud?: number;
  longitud?: number;
  telefono?: string;
  id_taller?: number;
  id_rol?: number;
}