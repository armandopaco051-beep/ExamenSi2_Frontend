import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroments';
import { 
    Vehiculo, 
    Prioridad, 
    CategoriaProblema, 
    EstadoIncidente, 
    TipoEvidencia, 
    EstadoAsignacion,
    Incidente,
    HistorialEstado,
    Asignacion,
    Evidencia,
    Notificacion,
    Metrica
} from '../../models/operaciones.model';

@Injectable({
    providedIn: 'root'
})
export class OperacionesService {
    private apiUrl = `${environment.apiUrl}/operaciones`;
    private catalogoUrl = `${environment.apiUrl}/catalogo`;
    private clientesUrl = `${environment.apiUrl}/clientes`;
    private multimediaUrl = `${environment.apiUrl}/multimedia`;
    private notificacionesUrl = `${environment.apiUrl}/notificaciones`;
    private analiticaUrl = `${environment.apiUrl}/analitica`;

    constructor(private http: HttpClient) {}

    // Vehículos
    listarVehiculos(): Observable<Vehiculo[]> {
        return this.http.get<Vehiculo[]>(this.clientesUrl + '/vehiculos');
    }

    crearVehiculo(datos: Omit<Vehiculo, 'codigo'>): Observable<Vehiculo> {
        return this.http.post<Vehiculo>(this.clientesUrl + '/vehiculos', datos);
    }

    actualizarVehiculo(codigo: number, datos: Partial<Vehiculo>): Observable<Vehiculo> {
        return this.http.put<Vehiculo>(`${this.clientesUrl}/vehiculos/${codigo}`, datos);
    }

    // Catálogos
    listarPrioridades(): Observable<Prioridad[]> {
        return this.http.get<Prioridad[]>(`${this.catalogoUrl}/prioridades`);
    }

    listarCategoriasProblema(): Observable<CategoriaProblema[]> {
        return this.http.get<CategoriaProblema[]>(`${this.catalogoUrl}/categorias-problema`);
    }

    listarEstadosIncidente(): Observable<EstadoIncidente[]> {
        return this.http.get<EstadoIncidente[]>(`${this.catalogoUrl}/estados-incidente`);
    }

    listarTiposEvidencia(): Observable<TipoEvidencia[]> {
        return this.http.get<TipoEvidencia[]>(`${this.catalogoUrl}/tipos-evidencia`);
    }

    listarEstadosAsignacion(): Observable<EstadoAsignacion[]> {
        return this.http.get<EstadoAsignacion[]>(`${this.catalogoUrl}/estados-asignacion`);
    }

    // Incidentes
    listarIncidentes(): Observable<Incidente[]> {
        return this.http.get<Incidente[]>(this.apiUrl + '/incidentes');
    }

    crearIncidente(datos: Omit<Incidente, 'codigo'>): Observable<Incidente> {
        return this.http.post<Incidente>(this.apiUrl + '/incidentes', datos);
    }

    actualizarIncidente(codigo: number, datos: Partial<Incidente>): Observable<Incidente> {
        return this.http.put<Incidente>(`${this.apiUrl}/incidentes/${codigo}`, datos);
    }

    cerrrarIncidente(codigo: number): Observable<{ mensaje: string }> {
        return this.http.put<{ mensaje: string }>(`${this.apiUrl}/incidentes/${codigo}/cerrar`, {});
    }

    obtenerHistorialIncidente(codigo: number): Observable<HistorialEstado[]> {
        return this.http.get<HistorialEstado[]>(`${this.apiUrl}/incidentes/${codigo}/historial`);
    }

    // Asignaciones
    listarAsignaciones(): Observable<Asignacion[]> {
        return this.http.get<Asignacion[]>(this.apiUrl + '/asignaciones');
    }

    crearAsignacion(datos: Omit<Asignacion, 'id'>): Observable<Asignacion> {
        return this.http.post<Asignacion>(this.apiUrl + '/asignaciones', datos);
    }

    aceptarAsignacion(id: number): Observable<{ mensaje: string }> {
        return this.http.put<{ mensaje: string }>(`${this.apiUrl}/asignaciones/${id}/aceptar`, {});
    }

    rechazarAsignacion(id: number, observacion: string): Observable<{ mensaje: string }> {
        return this.http.put<{ mensaje: string }>(`${this.apiUrl}/asignaciones/${id}/rechazar`, {
            observacion
        });
    }

    // Evidencias
    listarEvidencias(): Observable<Evidencia[]> {
        return this.http.get<Evidencia[]>(this.multimediaUrl + '/evidencias');
    }

    subirEvidencia(datos: FormData): Observable<Evidencia> {
        return this.http.post<Evidencia>(this.multimediaUrl + '/evidencias', datos);
    }

    // Notificaciones
    listarNotificaciones(): Observable<Notificacion[]> {
        return this.http.get<Notificacion[]>(this.notificacionesUrl);
    }

    marcarNotificacionLeida(codigo: number): Observable<{ mensaje: string }> {
        return this.http.put<{ mensaje: string }>(`${this.notificacionesUrl}/${codigo}/leer`, {});
    }

    // Métricas
    listarMetricas(): Observable<Metrica[]> {
        return this.http.get<Metrica[]>(this.analiticaUrl + '/metricas');
    }

    obtenerMetricasIncidente(codigo: number): Observable<Metrica[]> {
        return this.http.get<Metrica[]>(`${this.analiticaUrl}/incidentes/${codigo}/metricas`);
    }
}
