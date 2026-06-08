
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { UsuarioService } from '../../core/services/usuario.service';
import { AuthService } from '../../core/services/auth.service';
import { Usuario } from '../../models/usuario.model';
import * as L from 'leaflet';


interface RolDisponible {
  id: number;
  nombre: string;
}

interface FormUsuario {
  codigo: string;
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono: string;
  id_rol: number | null;
}

interface FormTaller {
  nombre: string;
  telefono: string;
  direccion: string;
  latitud: number;
  longitud: number;
  horario_inicio: string;
  horario_fin: string;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './usuario.component.html',
  styleUrls: ['./usuario.component.scss']
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];

  mostrarModal = false;
  mostrarMapa = false;
  loading = false;
  loadingDir = false;
  error = '';

  paso = 1;
  editandoCodigo: string | null = null;
  codigoUsuarioCreado = '';

  mapa: any = null;
  marcadorMapa: any = null;

  rolesDisponibles: RolDisponible[] = [
    { id: 1, nombre: 'Admin Plataforma' },
    { id: 2, nombre: 'Admin Taller' }
  ];

  formUsuario: FormUsuario = this.getFormUsuarioInicial();
  formTaller: FormTaller = this.getFormTallerInicial();

  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  getFormUsuarioInicial(): FormUsuario {
    return {
      codigo: '',
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      telefono: '',
      id_rol: null
    };
  }

  getFormTallerInicial(): FormTaller {
    return {
      nombre: '',
      telefono: '',
      direccion: '',
      latitud: -17.7833,
      longitud: -63.1821,
      horario_inicio: '08:00',
      horario_fin: '18:00'
    };
  }

  get esAdminTaller(): boolean {
    return Number(this.formUsuario.id_rol) === 2;
  }

  getRolesDisponibles(): RolDisponible[] {
    return this.rolesDisponibles;
  }

  cargarDatos(): void {
    this.usuarioService.listar().subscribe({
      next: (data) => {
        this.usuarios = data;
      },
      error: (err) => {
        this.error = err.error?.detail || 'No se pudieron cargar los usuarios';
      }
    });
  }

  abrirModal(usuario?: Usuario): void {
    this.error = '';
    this.mostrarModal = true;
    this.paso = 1;
    this.codigoUsuarioCreado = '';

    if (usuario) {
      this.editandoCodigo = usuario.codigo;
      this.formUsuario = {
        codigo: usuario.codigo,
        nombre: usuario.nombre || '',
        apellido: (usuario as any).apellido || '',
        email: usuario.email || '',
        password: '',
        telefono: usuario.telefono || '',
        id_rol: Number(usuario.id_rol)
      };
      this.formTaller = this.getFormTallerInicial();
      return;
    }

    this.editandoCodigo = null;
    this.formUsuario = this.getFormUsuarioInicial();
    this.formTaller = this.getFormTallerInicial();
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.mostrarMapa = false;
    this.loading = false;
    this.loadingDir = false;
    this.error = '';
    this.paso = 1;
    this.editandoCodigo = null;
    this.codigoUsuarioCreado = '';
    this.formUsuario = this.getFormUsuarioInicial();
    this.formTaller = this.getFormTallerInicial();

    if (this.mapa) {
      this.mapa.remove();
      this.mapa = null;
      this.marcadorMapa = null;
    }
  }

  validarUsuario(): boolean {
    if (!this.formUsuario.codigo.trim()) {
      this.error = 'El CI es obligatorio';
      return false;
    }

    if (!this.formUsuario.nombre.trim()) {
      this.error = 'El nombre es obligatorio';
      return false;
    }

    if (!this.formUsuario.apellido.trim()) {
      this.error = 'El apellido es obligatorio';
      return false;
    }

    if (!this.formUsuario.email.trim()) {
      this.error = 'El email es obligatorio';
      return false;
    }

    if (!this.formUsuario.telefono.trim()) {
      this.error = 'El teléfono es obligatorio';
      return false;
    }

    if (!this.formUsuario.id_rol) {
      this.error = 'Debes seleccionar un rol';
      return false;
    }

    if (!this.editandoCodigo && !this.formUsuario.password.trim()) {
      this.error = 'La contraseña es obligatoria';
      return false;
    }

    return true;
  }

  guardarUsuario(): void {
    this.error = '';

    if (!this.validarUsuario()) return;

    this.loading = true;

    const payload = {
      codigo: this.formUsuario.codigo.trim(),
      nombre: this.formUsuario.nombre.trim(),
      apellido: this.formUsuario.apellido.trim(),
      email: this.formUsuario.email.trim(),
      password: this.formUsuario.password,
      telefono: this.formUsuario.telefono.trim(),
      id_rol: Number(this.formUsuario.id_rol)
    };

    if (this.editandoCodigo) {
      this.usuarioService.actualizar(this.editandoCodigo, {
        nombre: payload.nombre,
        apellido: payload.apellido,
        email: payload.email,
        telefono: payload.telefono,
        id_rol: payload.id_rol
      }).subscribe({
        next: () => {
          this.loading = false;
          this.cerrarModal();
          this.cargarDatos();
        },
        error: (e) => {
          this.error = e.error?.detail || 'Error al actualizar usuario';
          this.loading = false;
        }
      });
      return;
    }

    if (this.esAdminTaller) {
      this.authService.registrarUsuarioAdminTaller(payload).subscribe({
        next: (res) => {
          this.codigoUsuarioCreado = res.codigo_usuario || this.formUsuario.codigo;
          this.paso = 2;
          this.loading = false;
        },
        error: (e) => {
          this.error = e.error?.detail || 'Error al crear admin_taller';
          this.loading = false;
        }
      });
    } else {
      this.authService.registro(payload).subscribe({
        next: () => {
          this.loading = false;
          this.cerrarModal();
          this.cargarDatos();
        },
        error: (e) => {
          this.error = e.error?.detail || 'Error al crear usuario';
          this.loading = false;
        }
      });
    }
  }

  validarTaller(): boolean {
    if (!this.formTaller.nombre.trim()) {
      this.error = 'El nombre del taller es obligatorio';
      return false;
    }

    if (!this.formTaller.telefono.trim()) {
      this.error = 'El teléfono del taller es obligatorio';
      return false;
    }

    if (!this.formTaller.direccion.trim()) {
      this.error = 'La dirección del taller es obligatoria';
      return false;
    }

    return true;
  }

  guardarTaller(): void {
    this.error = '';

    if (!this.validarTaller()) return;

    this.loading = true;

    const payloadTaller = {
      nombre: this.formTaller.nombre.trim(),
      telefono: this.formTaller.telefono.trim(),
      direccion: this.formTaller.direccion.trim(),
      latitud: this.formTaller.latitud,
      longitud: this.formTaller.longitud,
      horario_inicio: this.formTaller.horario_inicio,
      horario_fin: this.formTaller.horario_fin
    };

    this.authService.registrarTallerParaAdmin(
      this.codigoUsuarioCreado,
      payloadTaller
    ).subscribe({
      next: () => {
        this.loading = false;
        this.cerrarModal();
        this.cargarDatos();
      },
      error: (e) => {
        this.error = e.error?.detail || 'Error al registrar taller';
        this.loading = false;
      }
    });
  }

  desactivar(codigo: string): void {
    if (!confirm('¿Seguro que deseas desactivar este usuario?')) return;

    this.usuarioService.desactivar(codigo).subscribe({
      next: () => {
        this.cargarDatos();
      },
      error: (e) => {
        this.error = e.error?.detail || 'Error al desactivar usuario';
      }
    });
  }

  abrirMapa(): void {
    this.mostrarMapa = true;
    setTimeout(() => this.inicializarMapa(), 200);
  }

  inicializarMapa(): void {
    if (this.mapa) {
      this.mapa.remove();
      this.mapa = null;
      this.marcadorMapa = null;
    }

    this.mapa = L.map('mapa-usuarios-modal').setView(
      [this.formTaller.latitud, this.formTaller.longitud],
      13
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.mapa);

    this.marcadorMapa = L.marker(
      [this.formTaller.latitud, this.formTaller.longitud],
      { draggable: true }
    ).addTo(this.mapa);

    this.mapa.on('click', async (e: any) => {
      const { lat, lng } = e.latlng;
      await this.actualizarUbicacion(lat, lng);
    });

    this.marcadorMapa.on('dragend', async () => {
      const pos = this.marcadorMapa.getLatLng();
      await this.actualizarUbicacion(pos.lat, pos.lng);
    });

    setTimeout(() => {
      this.mapa.invalidateSize();
    }, 200);
  }

  async actualizarUbicacion(lat: number, lng: number): Promise<void> {
    this.formTaller.latitud = Number(lat.toFixed(7));
    this.formTaller.longitud = Number(lng.toFixed(7));

    if (this.marcadorMapa) {
      this.marcadorMapa.setLatLng([lat, lng]);
    }

    this.formTaller.direccion = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
    await this.geocodificar(lat, lng);
  }

  async geocodificar(lat: number, lng: number): Promise<void> {
    this.loadingDir = true;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'es'
          }
        }
      );

      const data = await res.json();
      const a = data?.address || {};

      const partes = [
        a.road || a.pedestrian || a.footway || a.path,
        a.house_number,
        a.neighbourhood || a.suburb || a.city_district,
        a.city || a.town || a.village,
        a.state
      ].filter(Boolean);

      this.formTaller.direccion =
        partes.join(', ') ||
        data?.display_name?.split(',').slice(0, 5).join(', ') ||
        `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
    } catch (error) {
      console.error('Error obteniendo dirección:', error);
      this.formTaller.direccion = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
    } finally {
      this.loadingDir = false;
    }
  }

  confirmarUbicacion(): void {
    if (!this.formTaller.direccion?.trim()) {
      this.formTaller.direccion =
        `Lat: ${this.formTaller.latitud.toFixed(5)}, Lng: ${this.formTaller.longitud.toFixed(5)}`;
    }

    this.mostrarMapa = false;
  }

  getNombreRol(idRol: number): string {
    const roles: Record<number, string> = {
      1: 'Admin plataforma',
      2: 'Admin taller',
      3: 'Técnico',
      4: 'Cliente'
    };

    return roles[idRol] || 'Sin rol';
  }
}
