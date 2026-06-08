import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroments';

export interface BitacoraEntry {
  id: number;
  codigo_usuario?: string | null;
  codigo_tecnico?: string | null;
  id_taller?: number | null;
  nombre_usuario?: string | null;
  accion: string;
  modulo: string;
  descripcion: string;
  ip_address: string;
  fecha: string;
}

@Injectable({ providedIn: 'root' })
export class BitacoraService {
  private apiUrl = `${environment.apiUrl}/bitacora`;

  constructor(private http: HttpClient) {}

  listar(modulo?: string, usuario?: string): Observable<BitacoraEntry[]> {
    let url = this.apiUrl;
    const params: string[] = [];

    if (modulo) params.push(`modulo=${modulo}`);
    if (usuario) params.push(`codigo_usuario=${usuario}`);

    if (params.length) url += `?${params.join('&')}`;

    return this.http.get<BitacoraEntry[]>(url);
  }
}