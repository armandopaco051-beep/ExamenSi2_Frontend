import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroments';

export interface Notificacion {
  codigo: number;
  fecha_envio: string;
  mensaje: string;
  leido: boolean;
  id_usuario: string;
  id_incidente?: number | null;
}

export interface ContadorNotificaciones {
  total_no_leidas: number;
}

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private apiUrl = `${environment.apiUrl}/notificaciones`;

  constructor(private http: HttpClient) {}

  obtenerContadorNoLeidas(): Observable<ContadorNotificaciones> {
    return this.http.get<ContadorNotificaciones>(`${this.apiUrl}/no-leidas/contador`);
  }

  listarMisNotificaciones(soloNoLeidas = false, limit = 20): Observable<Notificacion[]> {
    let params = new HttpParams().set('limit', String(limit));

    if (soloNoLeidas) {
      params = params.set('solo_no_leidas', 'true');
    }

    return this.http.get<Notificacion[]>(`${this.apiUrl}/mis-notificaciones`, { params });
  }

  marcarComoLeida(codigo: number): Observable<{ mensaje: string; notificacion: Notificacion }> {
    return this.http.put<{ mensaje: string; notificacion: Notificacion }>(
      `${this.apiUrl}/${codigo}/leer`,
      {}
    );
  }

  marcarTodasComoLeidas(): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/marcar-todas/leidas`, {});
  }
}
