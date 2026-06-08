import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroments';
import { loginRequest, Usuario, LoginTecnico } from '../../models/usuario.model';

export interface UsuarioRegistroPayload {
  codigo: string;
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono: string;
  id_rol: number;
}

export interface TallerRegistroPayload {
  nombre: string;
  telefono: string;
  direccion: string;
  latitud: number;
  longitud: number;
  horario_inicio?: string;
  horario_fin?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;

  private usuarioSubject = new BehaviorSubject<Usuario | null>(
    this.getUsuarioStorage()
  );

  usuario$ = this.usuarioSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Registro general:
  // úsalo para admin_plataforma o cualquier usuario que NO necesite taller
  registro(datos: UsuarioRegistroPayload): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/auth/registro`, datos);
  }

  // Paso 1: crear usuario admin_taller
  registrarUsuarioAdminTaller(
    datos: UsuarioRegistroPayload
  ): Observable<{ mensaje: string; codigo_usuario: string }> {
    return this.http.post<{ mensaje: string; codigo_usuario: string }>(
      `${this.apiUrl}/auth/registro-admin-taller/usuario`,
      datos
    );
  }

  // Paso 2: crear taller y vincularlo al admin_taller ya creado
  registrarTallerParaAdmin(
    codigoUsuario: string,
    datosTaller: TallerRegistroPayload
  ): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/auth/registro-admin-taller/taller/${codigoUsuario}`,
      datosTaller
    );
  }

 login(datos: loginRequest): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/auth/login`, datos).pipe(
    tap(response => {
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('usuario', JSON.stringify(response.usuario));

      if (response.id_taller !== null && response.id_taller !== undefined) {
        localStorage.setItem('id_taller', String(response.id_taller));
      } else {
        localStorage.removeItem('id_taller');
      }

      this.usuarioSubject.next(response.usuario);
    })
  );
}

  recuperarPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/recuperar-password`, { email });
  }

  cambiarPassword(
    email: string,
    nueva_contraseña: string,
    confirmar: string
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}/auth/cambiar-password`, {
      email,
      nueva_contraseña,
      confirmar
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('id_taller');
    this.usuarioSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUsuarioActual(): Usuario | null {
    return this.usuarioSubject.value;
  }

  tienePermiso(permiso: string): boolean {
    return this.getUsuarioActual()?.permisos?.includes(permiso) ?? false;
  }

  esAdminPlataforma(): boolean {
    return this.getUsuarioActual()?.id_rol === 1;
  }

  esAdminTaller(): boolean {
    return this.getUsuarioActual()?.id_rol === 2;
  }
  esTecnico(): boolean {
    return this.getUsuarioActual()?.id_rol === 3;
  }

  getUsuarioStorage(): Usuario | null {
    const u = localStorage.getItem('usuario');
    return u ? JSON.parse(u) : null;
  }
}
