import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { BitacoraService, BitacoraEntry } from '../../core/services/bitacora.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-bitacora',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './bitacora.component.html',
  styleUrls: ['./bitacora.component.scss']
})
export class BitacoraComponent implements OnInit {
  registros: BitacoraEntry[] = [];
  filtroModulo = '';
  filtroUsuario = '';
  loading = true;
  error = '';

  modulos = ['AUTH', 'USUARIOS', 'TALLERES', 'TECNICOS', 'INCIDENTES'];

  constructor(
    private bitacoraService: BitacoraService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.cargar();
  }

  esAdminTaller(): boolean {
    const usuario = this.authService.getUsuarioActual();
    return Number(usuario?.id_rol) === 2;
  }

  cargar() {
    this.loading = true;
    this.error = '';

    const usuarioFiltro = this.esAdminTaller() ? undefined : (this.filtroUsuario || undefined);

    this.bitacoraService.listar(
      this.filtroModulo || undefined,
      usuarioFiltro
    ).subscribe({
      next: (data) => {
        this.registros = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.detail || 'Error al cargar bitácora';
        this.loading = false;
      }
    });
  }

  limpiarFiltros() {
    this.filtroModulo = '';
    this.filtroUsuario = '';
    this.cargar();
  }

  getColorAccion(accion: string): string {
    if (accion.includes('LOGIN')) return 'info';
    if (accion.includes('CREAR') || accion.includes('REGISTRO')) return 'success';
    if (accion.includes('ELIMINAR') || accion.includes('DESACTIVAR')) return 'danger';
    if (accion.includes('ACTUALIZAR') || accion.includes('CAMBIO')) return 'warning';
    return 'default';
  }
}