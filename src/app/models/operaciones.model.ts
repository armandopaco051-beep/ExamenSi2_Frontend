export interface Vehiculo {
    codigo: number;
    modelo: string;
    placa: string;
    marca: string;
    año: string;
    activo: boolean;
    id_usuario: string;
}

export interface Prioridad {
    codigo: number;
    nivel: string;
}

export interface CategoriaProblema {
    codigo: number;
    nombre: string;
}

export interface EstadoIncidente {
    id: number;
    nombre: string;
}

export interface TipoEvidencia {
    codigo: number;
    nombre: string;
}

export interface EstadoAsignacion {
    id: number;
    nombre: string;
}

export interface Incidente {
    codigo: number;
    descripcion: string;
    latitud: number;
    longitud: number;
    fecha_reporte: string;
    fecha_cierre?: string;
    id_prioridad: number;
    id_categoria_problema: number;
    id_estado_incidente: number;
    id_vehiculo: number;
    codigo_usuario: string;
}

export interface HistorialEstado {
    codigo: number;
    fecha_cambio: string;
    id_incidente: number;
}

export interface Asignacion {
    id: number;
    fecha_asignacion: string;
    fecha_aceptacion: string;
    tiempo: string;
    observacion?: string;
    id_incidente: number;
    id_tecnico: number;
    id_taller: number;
    id_estado_asignacion: number;
}

export interface Evidencia {
    codigo: number;
    fecha_subida: string;
    transcripcion?: string;
    url_archivo?: string;
    id_tipo_evidencia: number;
    id_incidente: number;
}

export interface Notificacion {
    codigo: number;
    fecha_envio: string;
    mensaje: string;
    leido: boolean;
    id_usuario: string;
    id_incidente: number;
}

export interface Metrica {
    id: number;
    fecha_inicio: string;
    fecha_fin?: string;
    tiempo_respuesta: string;
    tiempo_atencion?: string;
    puntaje: number;
    id_incidente: number;
}
