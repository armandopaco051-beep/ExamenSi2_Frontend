import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroments';


export interface SolicitudRegistroPayload{
  codigo_usuario : string ;
  nombre : string; 
  apellido: string ; 
  email :string ; 
  password : string; 
  telefono :string; 
  nombre_taller : string ; 
  telefono_taller: string ; 
  direccion_taller: string ; 
  latitud_taller : number; 
  longitud_taller :number ; 
  horario_inicio ?: string; 
  horario_fin ?: string; 
  
}

@Injectable({ providedIn: 'root' })
export class SolicitudService {
   

  private api = `${environment.apiUrl}/solicitudes-registro`;

  constructor(private http: HttpClient) {}

  solicitar(datos: SolicitudRegistroPayload): Observable<any> {
    return this.http.post(this.api, datos);
  }

  listar(estado? :string): Observable<any[]> {
    let url = this.api; 
    if (estado) url += `?estado=${estado}`;
    return this.http.get<any[]>(url);
  }

  contarPendientes(): Observable<{ pendientes: number }> {
    return this.http.get<{ pendientes: number }>(
      `${this.api}/pendientes/count`);
  }

  responder(codigoUsuario: string, aceptada: boolean, obs = ''): Observable<any> {
    return this.http.put(`${this.api}/${codigoUsuario}/responder`,
      { aceptada, observacion: obs });
  }
}