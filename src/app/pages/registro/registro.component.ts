import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { SolicitudService } from "../../core/services/solicitud.service";
import * as L from 'leaflet';

@Component({
    selector: 'app-registro',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './registro.component.html',
    styleUrls: ['./registro.component.scss']
})
export class RegistroComponent {
    form = {
         codigo: '',
         nombre: '',
        apellido: '',
        email: '',
       password: '',
         telefono: '',
         id_rol: 4,

        nombre_taller: '',
        telefono_taller: '',
        direccion_taller: '',
        latitud_taller: -17.7833,
        longitud_taller: -63.1821,
        horario_inicio: '08:00',
        horario_fin: '18:00'
    };
    loading = false;
    error = '';
    success = ''; 
    private mapaRegistro :any; 
    private markerRegistro: any ;
    mostrarMapaRegistro = false ; 
    constructor(private auth: AuthService, private router: Router, private solicitudService: SolicitudService
       

    ) {}

   onRegistro() {
     // Validaciones básicas
    if (!this.form.nombre || !this.form.apellido || !this.form.codigo || 
        !this.form.email || !this.form.password || !this.form.telefono) {
      this.error = 'Por favor completa todos los campos obligatorios';
      return;
    }

    if (this.form.password.length < 8) {
      this.error = 'La contraseña debe tener al menos 8 caracteres';
      return;
    }
  this.loading = true;
  this.error = '';
  this.success = '';

  // CLIENTE
  if (Number(this.form.id_rol) === 4) {
    this.auth.registro({
      codigo: this.form.codigo,
      nombre: this.form.nombre,
      apellido: this.form.apellido,
      email: this.form.email,
      password: this.form.password,
      telefono: this.form.telefono,
      id_rol: 4
    }).subscribe({
      next: () => {
        this.success = 'Cuenta creada correctamente. Redirigiendo...';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.error = err.error?.detail || 'Error al crear cuenta';
        this.loading = false;
      }
    });
    return;
  }

  // ADMIN_TALLER
  if (Number(this.form.id_rol) === 2) {
    this.solicitudService.solicitar({
      codigo_usuario: this.form.codigo,
      nombre: this.form.nombre,
      apellido: this.form.apellido,
      email: this.form.email,
      password: this.form.password,
      telefono: this.form.telefono,
      nombre_taller: this.form.nombre_taller,
      telefono_taller: this.form.telefono_taller,
      direccion_taller: this.form.direccion_taller,
      latitud_taller: this.form.latitud_taller,
      longitud_taller: this.form.longitud_taller,
      horario_inicio: this.form.horario_inicio,
      horario_fin: this.form.horario_fin
    }).subscribe({
      next: () => {
        this.success = 'Solicitud enviada. Cuando el administrador la apruebe, inicia sesion para elegir y pagar tu plan.';
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.detail || 'Error al enviar solicitud';
        this.loading = false;
      }
    });
  }
  
  
  
}
resetForm() {
    this.form = {
      codigo: '',
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      telefono: '',
      id_rol: 4,
      nombre_taller: '',
      telefono_taller: '',
      direccion_taller: '',
      latitud_taller: -17.7833,
      longitud_taller: -63.1821,
      horario_inicio: '08:00',
      horario_fin: '18:00'
    };
  }

  // ========== MÉTODOS DEL MAPA ==========
  abrirMapaRegistro(): void {
    this.mostrarMapaRegistro = true;
    setTimeout(() => {
      this.inicializarMapaRegistro();
    }, 100);
  }

  cerrarMapaRegistro(): void {
    this.mostrarMapaRegistro = false;
    if (this.mapaRegistro) {
      this.mapaRegistro.remove();
      this.mapaRegistro = null;
    }
  }

  confirmarUbicacionRegistro(): void {
    this.mostrarMapaRegistro = false;
  }

  inicializarMapaRegistro(): void {
    if (this.mapaRegistro) {
      this.mapaRegistro.remove();
      this.mapaRegistro = null;
    }

    this.mapaRegistro = L.map('mapa-registro-taller').setView(
      [this.form.latitud_taller || -17.7833, this.form.longitud_taller || -63.1821],
      13
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.mapaRegistro);

    if (this.form.latitud_taller && this.form.longitud_taller) {
      this.markerRegistro = L.marker([
        this.form.latitud_taller,
        this.form.longitud_taller
      ]).addTo(this.mapaRegistro);
    }

    this.mapaRegistro.on('click', async (e: any) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      
      this.form.latitud_taller = Number(lat.toFixed(6));
      this.form.longitud_taller = Number(lng.toFixed(6));
      
      if (this.markerRegistro) {
        this.mapaRegistro.removeLayer(this.markerRegistro);
      }
      
      this.markerRegistro = L.marker([lat, lng]).addTo(this.mapaRegistro);
      await this.obtenerDireccionDesdeCoordenadas(lat, lng);
    });

    setTimeout(() => {
      if (this.mapaRegistro) {
        this.mapaRegistro.invalidateSize();
      }
    }, 200);
  }

  async obtenerDireccionDesdeCoordenadas(lat: number, lng: number): Promise<void> {
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      const data = await resp.json();
      this.form.direccion_taller = data?.display_name || `${lat}, ${lng}`;
    } catch (error) {
      console.error('Error obteniendo dirección', error);
      this.form.direccion_taller = `${lat}, ${lng}`;
    }
  }
    
}
