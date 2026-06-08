import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroments';
import { Rol, Permiso } from '../../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class RolesService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listarRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.apiUrl}/roles`);
  }

  listarPermisos(): Observable<Permiso[]> {
    return this.http.get<Permiso[]>(`${this.apiUrl}/permisos`);
  }

  permisosDelRol(idRol: number): Observable<Permiso[]> {
    return this.http.get<Permiso[]>(`${this.apiUrl}/roles/${idRol}/permisos`);
  }

  agregarPermisoARol(idRol: number, idPermiso: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/roles/${idRol}/permisos`,
      { id_permiso: idPermiso }
    );
  }

  quitarPermisoDeRol(idRol: number, idPermiso: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/roles/${idRol}/permisos/${idPermiso}`
    );
  }

  cambiarRolUsuario(codigo: string, idRol: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/usuarios/${codigo}/rol`,
      { id_rol: idRol }
    );
  }
}