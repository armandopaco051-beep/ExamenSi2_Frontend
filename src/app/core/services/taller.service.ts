import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  CoberturaTaller,
  CoberturaUpdate,
  CoberturaVerificacion,
  Taller,
  TallerCreate,
  Tecnico
} from '../../models/taller.model';
import { environment } from '../../../enviroments/enviroments';

@Injectable({ providedIn: 'root' })
export class TallerService {
  private apiUrl = `${environment.apiUrl}/talleres`;

  constructor(private http: HttpClient) {}

  private normalizarTaller(t: any): Taller {
    return {
      codigo: t.codigo,
      nombre: t.nombre,
      telefono: t.telefono,
      direccion: t.direccion,
      latitud: Number(t.latitud),
      longitud: Number(t.longitud),
      activo: !!t.activo,
      estado_registro: t.estado_registro ?? 'pendiente',
      observacion_admin: t.observacion_admin ?? null,
      fecha_solicitud: t.fecha_solicitud ?? null,
      fecha_respuesta: t.fecha_respuesta ?? null,
      horario_inicio: t.horario_inicio ? String(t.horario_inicio).slice(0, 5) : '',
      horario_fin: t.horario_fin ? String(t.horario_fin).slice(0, 5) : '',
      usuario_id: t.usuario_id ?? null
    };
  }

  private normalizarCobertura(c: any): CoberturaTaller {
    return {
      codigo_taller: c.codigo_taller ?? c.id_taller ?? c.taller_codigo ?? c.codigo,
      radio_km: Number(c.radio_km ?? c.radio_cobertura_km ?? c.radio ?? c.radio_cobertura ?? 0),
      activo: c.activo ?? c.cobertura_activa ?? true,
      latitud: c.latitud !== undefined ? Number(c.latitud) : undefined,
      longitud: c.longitud !== undefined ? Number(c.longitud) : undefined,
      nombre_taller: c.nombre_taller ?? c.taller?.nombre
    };
  }

  private normalizarVerificacion(v: any): CoberturaVerificacion {
    return {
      dentro_cobertura: !!(v.dentro_cobertura ?? v.en_cobertura ?? v.tiene_cobertura ?? v.cubierto),
      distancia_km: v.distancia_km !== undefined ? Number(v.distancia_km) : undefined,
      radio_km: v.radio_km !== undefined ? Number(v.radio_km) : undefined,
      mensaje: v.mensaje ?? v.detail
    };
  }

  listar(): Observable<Taller[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(data => data.map(t => this.normalizarTaller(t)))
    );
  }

  obtener(codigo: number): Observable<Taller> {
    return this.http.get<any>(`${this.apiUrl}/${codigo}`).pipe(
      map(t => this.normalizarTaller(t))
    );
  }

  crear(datos: TallerCreate): Observable<Taller> {
    return this.http.post<any>(this.apiUrl, datos).pipe(
      map(t => this.normalizarTaller(t))
    );
  }

  actualizar(codigo: number, datos: Partial<TallerCreate>): Observable<Taller> {
    return this.http.put<any>(`${this.apiUrl}/${codigo}`, datos).pipe(
      map(t => this.normalizarTaller(t))
    );
  }

  desactivar(codigo: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/${codigo}`);
  }

  // Técnicos
  listarTecnicos(): Observable<Tecnico[]> {
    return this.http.get<Tecnico[]>(`${this.apiUrl}/tecnicos`);
  }

  obtenerTecnicosPorTaller(codigoTaller: number): Observable<Tecnico[]> {
    return this.http.get<Tecnico[]>(`${this.apiUrl}/${codigoTaller}/tecnicos`);
  }

  crearTecnico(datos: Omit<Tecnico, 'codigo'>): Observable<Tecnico> {
    return this.http.post<Tecnico>(`${this.apiUrl}/tecnicos`, datos);
  }

  actualizarTecnico(codigo: number, datos: Partial<Tecnico>): Observable<Tecnico> {
    return this.http.put<Tecnico>(`${this.apiUrl}/tecnicos/${codigo}`, datos);
  }

  eliminarTecnico(codigo: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/tecnicos/${codigo}`);
  }

  // Acciones de administrador
  aprobarTaller(codigo: number): Observable<{ mensaje: string }> {
    return this.http.put<{ mensaje: string }>(`${this.apiUrl}/${codigo}/aprobar`, {});
  }

  rechazarTaller(codigo: number, observacion: string): Observable<{ mensaje: string }> {
    return this.http.put<{ mensaje: string }>(`${this.apiUrl}/${codigo}/rechazar`, { observacion_admin: observacion });
  }

  obtenerCobertura(codigo: number): Observable<CoberturaTaller> {
    return this.http.get<any>(`${this.apiUrl}/${codigo}/cobertura`).pipe(
      map(c => this.normalizarCobertura(c))
    );
  }

  actualizarCobertura(codigo: number, datos: CoberturaUpdate): Observable<CoberturaTaller> {
    return this.http.put<any>(`${this.apiUrl}/${codigo}/cobertura`, datos).pipe(
      map(c => this.normalizarCobertura(c))
    );
  }

  verificarCobertura(codigo: number, latitud: number, longitud: number): Observable<CoberturaVerificacion> {
    return this.http.get<any>(`${this.apiUrl}/${codigo}/cobertura/verificar`, {
      params: {
        latitud,
        longitud
      }
    }).pipe(
      map(v => this.normalizarVerificacion(v))
    );
  }
}
