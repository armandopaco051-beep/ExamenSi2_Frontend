import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../enviroments/enviroments';
import {
  RechazarCotizacionPayload,
  ResponderCotizacionPayload,
  SolicitudCotizacion
} from '../../models/cotizacion.model';

@Injectable({ providedIn: 'root' })
export class CotizacionService {
  private apiUrl = `${environment.apiUrl}/cotizaciones`;

  constructor(private http: HttpClient) {}

  listarMisSolicitudes(): Observable<SolicitudCotizacion[]> {
    return this.http.get<any>(`${this.apiUrl}/mis-solicitudes`).pipe(
      map(response => {
        const solicitudes = this.extraerLista(response);
        return solicitudes.map(item => this.normalizarSolicitud(item));
      })
    );
  }

  responder(idSolicitud: number, payload: ResponderCotizacionPayload): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/solicitudes/${idSolicitud}/responder`,
      payload
    );
  }

  rechazar(idSolicitud: number, payload: RechazarCotizacionPayload): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/solicitudes/${idSolicitud}/rechazar`,
      payload
    );
  }

  private extraerLista(response: any): any[] {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.solicitudes)) return response.solicitudes;
    if (Array.isArray(response?.cotizaciones)) return response.cotizaciones;
    if (Array.isArray(response?.data)) return response.data;
    return [];
  }

  private normalizarSolicitud(item: any): SolicitudCotizacion {
    const solicitud = item?.solicitud || {};
    const cotizacion = item?.cotizacion || {};
    const incidente = item?.incidente || {};

    return {
      ...item,
      id: cotizacion.id ?? item?.id,
      codigo: item?.codigo,
      id_solicitud: solicitud.id ?? cotizacion.id_solicitud ?? item?.id_solicitud ?? item?.solicitud_id,
      id_incidente: solicitud.id_incidente ?? incidente.id_incidente ?? incidente.id ?? incidente.codigo ?? item?.id_incidente,
      estado: cotizacion.estado ?? item?.estado ?? solicitud.estado,
      distancia_km: cotizacion.distancia_km ?? item?.distancia_km,
      fecha_limite: solicitud.fecha_vencimiento ?? solicitud.fecha_limite ?? cotizacion.fecha_vencimiento ?? item?.fecha_limite ?? item?.fecha_vencimiento,
      fecha_vencimiento: solicitud.fecha_vencimiento ?? cotizacion.fecha_vencimiento ?? item?.fecha_vencimiento,
      fecha_invitacion: cotizacion.fecha_invitacion ?? item?.fecha_invitacion,
      fecha_respuesta: cotizacion.fecha_respuesta ?? item?.fecha_respuesta,
      monto_estimado: cotizacion.monto_estimado ?? item?.monto_estimado,
      tiempo_llegada_minutos: cotizacion.tiempo_llegada_minutos ?? item?.tiempo_llegada_minutos,
      tiempo_reparacion_minutos: cotizacion.tiempo_reparacion_minutos ?? item?.tiempo_reparacion_minutos,
      descripcion_servicio: cotizacion.descripcion_servicio ?? item?.descripcion_servicio,
      id_tecnico: cotizacion.id_tecnico ?? item?.id_tecnico ?? null,
      observacion: cotizacion.observacion ?? item?.observacion,
      incidente: {
        ...item?.incidente,
        ...incidente,
        id: incidente.id ?? incidente.codigo ?? solicitud.id_incidente ?? item?.id_incidente,
        id_incidente: incidente.id_incidente ?? solicitud.id_incidente ?? item?.id_incidente,
        descripcion: incidente.descripcion ?? item?.descripcion,
        latitud: incidente.latitud ?? item?.latitud,
        longitud: incidente.longitud ?? item?.longitud,
        direccion: incidente.direccion ?? item?.direccion,
        categoria: incidente.categoria ?? item?.categoria,
        prioridad: incidente.prioridad ?? item?.prioridad,
        fecha_reporte: incidente.fecha_reporte ?? item?.fecha_reporte
      },
      solicitud,
      cotizacion
    };
  }
}
