import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../enviroments/enviroments';

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  enviarUbicacion(datos: {
    id_asignacion: number;
    latitud: number;
    longitud: number;
  }) {
    return this.http.post<any>(
      `${this.apiUrl}/tracking/ubicacion`,
      datos,
      { headers: this.getHeaders() }
    );
  }

  obtenerUltimaUbicacion(idIncidente: number) {
    return this.http.get<any>(
      `${this.apiUrl}/tracking/incidente/${idIncidente}/ultima`,
      { headers: this.getHeaders() }
    );
  }
}