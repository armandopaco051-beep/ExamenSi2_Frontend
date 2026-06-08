import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, timeout } from 'rxjs';
import { environment } from '../../../enviroments/enviroments';

export interface ChatMensaje {
  id?: number;
  id_chat?: number;
  id_incidente: number;
  emisor_id?: string;
  emisor_tipo: 'tecnico' | 'cliente' | string;
  mensaje: string;
  tipo_mensaje: 'texto' | string;
  leido?: boolean;
  fecha_hora?: string;
}

export interface ChatMensajePayload {
  mensaje: string;
  tipo_mensaje: 'texto';
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  obtenerMensajes(idIncidente: number, token: string): Observable<ChatMensaje[]> {
    return this.http.get<any>(
      `${this.apiUrl}/chat/incidentes/${idIncidente}/mensajes`,
      { params: { token } }
    ).pipe(
      timeout(10000),
      map((response) => this.normalizarMensajes(response))
    );
  }

  enviarMensajeHttp(idIncidente: number, token: string, datos: ChatMensajePayload): Observable<ChatMensaje> {
    return this.http.post<ChatMensaje>(
      `${this.apiUrl}/chat/incidentes/${idIncidente}/mensajes`,
      datos,
      { params: { token } }
    ).pipe(timeout(10000));
  }

  crearWebSocketUrl(idIncidente: number, token: string): string {
    const base = this.apiUrl.replace(/\/$/, '');
    const wsBase = base.startsWith('https://')
      ? base.replace('https://', 'wss://')
      : base.replace('http://', 'ws://');

    return `${wsBase}/chat/ws/incidentes/${idIncidente}?token=${encodeURIComponent(token)}`;
  }

  private normalizarMensajes(response: any): ChatMensaje[] {
    if (Array.isArray(response)) return response;

    if (Array.isArray(response?.mensajes)) return response.mensajes;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.resultados)) return response.resultados;

    return [];
  }
}
