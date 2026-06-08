import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { RolesService } from '../../core/services/roles.service';
import { Rol, Permiso } from '../../models/usuario.model';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})
export class RolesComponent implements OnInit {
  roles: Rol[] = [];
  permisos: Permiso[] = [];
  permisosDelRol: Permiso[] = [];
  rolSeleccionado: Rol | null = null;
  loading = false;

  constructor(private rolesService: RolesService) {}

  ngOnInit() {
    // Cargar roles desde el backend
    this.rolesService.listarRoles().subscribe({
      next: (r) => {
        if (r && r.length > 0) {
          this.roles = r;
        } else {
          // Si no hay roles, usar datos de ejemplo
          this.roles = this.getRolesEjemplo();
        }
      },
      error: () => {
        // Si hay error, usar datos de ejemplo
        this.roles = this.getRolesEjemplo();
      }
    });

    // Cargar permisos desde el backend
    this.rolesService.listarPermisos().subscribe({
      next: (p) => {
        if (p && p.length > 0) {
          this.permisos = p;
        } else {
          // Si no hay permisos, usar datos de ejemplo
          this.permisos = this.getPermisosEjemplo();
        }
      },
      error: () => {
        // Si hay error, usar datos de ejemplo
        this.permisos = this.getPermisosEjemplo();
      }
    });
  }

  // hace la peticion para obtener los permisos del rol seleccionado
  seleccionarRol(rol: Rol) {
    this.rolSeleccionado = rol;
    this.rolesService.permisosDelRol(rol.id).subscribe(
      p => this.permisosDelRol = p
    );
  }
// verifica si el permiso esta asignado al rol
  tienePermiso(idPermiso: number): boolean {
    return this.permisosDelRol.some(p => p.id === idPermiso);
  }

  togglePermiso(permiso: Permiso) {
    if (!this.rolSeleccionado) return;
    const idRol = this.rolSeleccionado.id;

    if (this.tienePermiso(permiso.id)) {
      this.rolesService.quitarPermisoDeRol(idRol, permiso.id).subscribe(
        () => this.seleccionarRol(this.rolSeleccionado!)
      );
    } else {
      this.rolesService.agregarPermisoARol(idRol, permiso.id).subscribe(
        () => this.seleccionarRol(this.rolSeleccionado!)
      );
    }
  }
  getDescRol(nombre: string): string {
  const descs: Record<string, string> = {
    'admin_plataforma': 'Acceso total al sistema',
    'admin_taller': 'Gestiona su propio taller',
    'tecnico': 'Ve sus incidentes asignados',
    'cliente': 'Usa la app móvil'
  };
  return descs[nombre] || '';
}

getDescPermiso(nombre: string): string {
  const descs: Record<string, string> = {
    'gestionar_usuarios': 'Crear, editar y desactivar usuarios',
    'gestionar_talleres': 'CRUD completo de talleres',
    'gestionar_tecnicos': 'CRUD completo de técnicos',
    'ver_dashboard': 'Acceso al panel de estadísticas',
    'ver_bitacora': 'Ver registro de actividad',
    'asignar_usuarios_taller': 'Vincular usuarios a talleres',
    'ver_taller_propio': 'Ver datos de su taller',
    'ver_tecnicos_propio': 'Ver técnicos de su taller',
    'ver_incidentes_taller': 'Ver incidentes del taller',
    'ver_reportes_taller': 'Ver reportes limitados',
    'actualizar_incidente': 'Actualizar estado del servicio',
    'reportar_incidente': 'Crear reporte de emergencia'
  };
  return descs[nombre] || '';
}

// Métodos para datos de ejemplo
getRolesEjemplo(): Rol[] {
  return [
    { id: 1, nombre: 'Admin Plataforma' },
    { id: 2, nombre: 'Admin Taller' },
    { id: 3, nombre: 'Técnico' },
    { id: 4, nombre: 'Cliente' }
  ];
}

getPermisosEjemplo(): Permiso[] {
  return [
    { id: 1, nombre: 'gestionar_usuarios' },
    { id: 2, nombre: 'gestionar_talleres' },
    { id: 3, nombre: 'gestionar_tecnicos' },
    { id: 4, nombre: 'ver_dashboard' },
    { id: 5, nombre: 'ver_bitacora' },
    { id: 6, nombre: 'asignar_usuarios_taller' },
    { id: 7, nombre: 'ver_taller_propio' },
    { id: 8, nombre: 'ver_tecnicos_propio' },
    { id: 9, nombre: 'ver_incidentes_taller' },
    { id: 10, nombre: 'ver_reportes_taller' },
    { id: 11, nombre: 'actualizar_incidente' },
    { id: 12, nombre: 'reportar_incidente' }
  ];
}
}