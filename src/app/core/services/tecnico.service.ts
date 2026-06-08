import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroments';
import { Tecnico,TecnicoCreate,TecnicoUpdate } from '../../models/tecnico.models';

@Injectable({ providedIn: 'root' })
export class TecnicoService {
  private apiUrl = `${environment.apiUrl}/tecnicos`;

  constructor(private http: HttpClient) {}

  // GLOBAL
  listarPorTaller(id_taller: number): Observable<Tecnico[]> {
    return this.http.get<Tecnico[]>(`${this.apiUrl}/taller/${id_taller}`);
  }

  crear(datos: TecnicoCreate): Observable<Tecnico> {
    return this.http.post<Tecnico>(`${this.apiUrl}/crear`, datos);
  }

  actualizar(codigo: string, datos: TecnicoUpdate): Observable<Tecnico> {
    return this.http.patch<Tecnico>(`${this.apiUrl}/${codigo}`, datos);
  }

  eliminar(codigo: string): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/${codigo}`);
  }

  // ADMIN TALLER
  listarMisTecnicos(): Observable<Tecnico[]> {
    return this.http.get<Tecnico[]>(`${this.apiUrl}/mis-tecnicos`);
  }

  crearMiTecnico(datos: TecnicoCreate): Observable<Tecnico> {
    return this.http.post<Tecnico>(`${this.apiUrl}/mis-tecnicos`, datos);
  }

  actualizarMiTecnico(codigo: string, datos: TecnicoUpdate): Observable<Tecnico> {
    return this.http.patch<Tecnico>(`${this.apiUrl}/mis-tecnicos/${codigo}`, datos);
  }

  eliminarMiTecnico(codigo: string): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/mis-tecnicos/${codigo}`);
  }
}