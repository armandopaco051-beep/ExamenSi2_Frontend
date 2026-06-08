import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroments';
import { TecnicoDashboardResumen, IncidenteTecnicoActual, HistorialTecnicoItem } from '../../models/dashboard_tecnicos.model';

export interface ProgresoTecnicoPayload {
  observacion?: string;
  latitud?: number;
  longitud?: number;
}

export interface ValidarArriboPayload {
  pin?: string;
  qr_token?: string;
  latitud?: number;
  longitud?: number;
}

export type AccionProgresoTecnico = 'aceptar' | 'en-camino' | 'llegada' | 'iniciar-atencion' | 'finalizar';



@Injectable({
  providedIn: 'root'
})
export class TecnicoDashboardService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient){

  }
   // ✅ CAMBIO: agrega token para endpoints protegidos
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    console.log('token enviado al backend', token)

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }
  obtenerResumen(): Observable<TecnicoDashboardResumen>{
    return this.http.get<TecnicoDashboardResumen>(`${this.apiUrl}/tecnicos/dashboard`, { headers: this.getHeaders() });
  }
  obtenerAsignacionActual() : Observable<IncidenteTecnicoActual | null>{
    return this.http.get<IncidenteTecnicoActual | null>(`${this.apiUrl}/tecnicos/asignacion-actual`, { headers: this.getHeaders() });
  }
  obtenerHistorial() : Observable<HistorialTecnicoItem[]>{
    return this.http.get<HistorialTecnicoItem[]>(`${this.apiUrl}/tecnicos/historial`, { headers: this.getHeaders() });
  }
  iniciarRuta(idAsignacion : number) : Observable<any>{
    return this.http.put<any>(`${this.apiUrl}/asignacion/${idAsignacion}/iniciar-ruta`, {}, { headers: this.getHeaders() });
  }
  finalizarServicio(idAsignacion : number) : Observable<any>{
    return this.http.put<any>(`${this.apiUrl}/asignacion/${idAsignacion}/finalizar`, {}, { headers: this.getHeaders() });
  }

  actualizarProgreso(
    idAsignacion: number,
    accion: AccionProgresoTecnico,
    datos: ProgresoTecnicoPayload = {}
  ): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/tecnicos/progreso/${idAsignacion}/${accion}`,
      datos,
      { headers: this.getHeaders() }
    );
  }

  aceptarServicio(idAsignacion: number, datos: ProgresoTecnicoPayload = {}): Observable<any> {
    return this.actualizarProgreso(idAsignacion, 'aceptar', datos);
  }

  marcarEnCamino(idAsignacion: number, datos: ProgresoTecnicoPayload = {}): Observable<any> {
    return this.actualizarProgreso(idAsignacion, 'en-camino', datos);
  }

  marcarLlegada(idAsignacion: number, datos: ProgresoTecnicoPayload = {}): Observable<any> {
    return this.actualizarProgreso(idAsignacion, 'llegada', datos);
  }

  iniciarAtencion(idAsignacion: number, datos: ProgresoTecnicoPayload = {}): Observable<any> {
    return this.actualizarProgreso(idAsignacion, 'iniciar-atencion', datos);
  }

  finalizarProgreso(idAsignacion: number, datos: ProgresoTecnicoPayload = {}): Observable<any> {
    return this.actualizarProgreso(idAsignacion, 'finalizar', datos);
  }

  obtenerLineaTiempo(idIncidente: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/incidentes/${idIncidente}/linea-tiempo`,
      { headers: this.getHeaders() }
    );
  }

  validarArribo(idAsignacion: number, datos: ValidarArriboPayload): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/validacion-arribo/asignacion/${idAsignacion}/validar`,
      datos,
      { headers: this.getHeaders() }
    );
  }
}
