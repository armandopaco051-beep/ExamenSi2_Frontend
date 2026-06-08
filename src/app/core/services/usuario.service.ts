import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroments';
import { Usuario } from '../../models/usuario.model';

@Injectable({providedIn: 'root'})
export class UsuarioService{
    private apiUrl = `${environment.apiUrl}/usuarios`;
    constructor (private http: HttpClient) {}
    // Obtener usuario por código hace petición GET
    obtener(codigo: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${codigo}`);
  }
  
  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/`);
  }
  desactivar(codigo: string): Observable<{ mensaje: string }> {
  return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/${codigo}`);
  }

  // Actualizar usuario hace petición PUT
  actualizar(codigo: string, datos: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${codigo}`, datos);
  }
}
