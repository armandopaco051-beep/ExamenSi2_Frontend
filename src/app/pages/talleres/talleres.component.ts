import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { TallerService } from '../../core/services/taller.service';
import { CoberturaVerificacion, Taller, TallerCreate } from '../../models/taller.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-talleres',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './talleres.component.html',
  styleUrls: ['./talleres.component.scss']
})
export class TalleresComponent implements OnInit, OnDestroy {
  talleres: Taller[] = [];
  mostrarModal = false;
  mostrarMapa = false;
  mostrarCobertura = false;
  editando: Taller | null = null;
  tallerCobertura: Taller | null = null;
  loading = false;
  loadingDireccion = false;
  loadingCobertura = false;
  guardandoCobertura = false;
  verificandoCobertura = false;
  error = '';
  errorCobertura = '';
  resultadoCobertura: CoberturaVerificacion | null = null;

  form: TallerCreate = this.getFormInicial();
  formCobertura = this.getCoberturaInicial();
  puntoVerificacion = {
    latitud: 0,
    longitud: 0
  };

  private mapa: L.Map | null = null;
  private marcador: L.Marker | null = null;
  private mapaCobertura: L.Map | null = null;
  private marcadorTallerCobertura: L.Marker | null = null;
  private circuloCobertura: L.Circle | null = null;
  private marcadorVerificacion: L.Marker | null = null;

  constructor(private tallerService: TallerService) {}

  ngOnInit(): void {
    this.corregirIconosLeaflet();
    this.cargarTalleres();
  }

  ngOnDestroy(): void {
    this.destruirMapa();
    this.destruirMapaCobertura();
  }

  getFormInicial(): TallerCreate {
    return {
      nombre: '',
      telefono: '',
      direccion: '',
      latitud: 0,
      longitud: 0,
      horario_inicio: '08:00',
      horario_fin: '18:00'
    };
  }

  getCoberturaInicial(): { radio_km: number; activo: boolean } {
    return {
      radio_km: 5,
      activo: true
    };
  }

  cargarTalleres(): void {
    this.tallerService.listar().subscribe({
      next: (data) => {
        this.talleres = data;
      },
      error: (err) => {
        console.error('Error al listar talleres:', err);
        this.error = err.error?.detail || 'Error al listar talleres';
      }
    });
  }

  abrirModal(taller?: Taller): void {
    this.editando = taller || null;
    this.form = taller ? {
      nombre: taller.nombre,
      telefono: taller.telefono,
      direccion: taller.direccion,
      latitud: taller.latitud,
      longitud: taller.longitud,
      horario_inicio: taller.horario_inicio || '08:00',
      horario_fin: taller.horario_fin || '18:00',
      usuario_id: taller.usuario_id || undefined
    } : this.getFormInicial();
    this.mostrarModal = true;
    this.error = '';
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.mostrarMapa = false;
    this.destruirMapa();
    this.error = '';
    this.form = this.getFormInicial();
    this.editando = null;
  }

  abrirCobertura(taller: Taller): void {
    this.tallerCobertura = taller;
    this.formCobertura = this.getCoberturaInicial();
    this.puntoVerificacion = {
      latitud: Number(taller.latitud || 0),
      longitud: Number(taller.longitud || 0)
    };
    this.resultadoCobertura = null;
    this.errorCobertura = '';
    this.loadingCobertura = true;
    this.mostrarCobertura = true;

    this.tallerService.obtenerCobertura(taller.codigo).subscribe({
      next: (cobertura) => {
        this.formCobertura = {
          radio_km: cobertura.radio_km > 0 ? cobertura.radio_km : 5,
          activo: cobertura.activo
        };
        this.loadingCobertura = false;
        setTimeout(() => this.inicializarMapaCobertura(), 250);
      },
      error: (err) => {
        console.error('Error al cargar cobertura:', err);
        this.errorCobertura = err.error?.detail || 'No se pudo cargar la cobertura. Puedes guardar una nueva configuración.';
        this.loadingCobertura = false;
        setTimeout(() => this.inicializarMapaCobertura(), 250);
      }
    });
  }

  cerrarCobertura(): void {
    this.mostrarCobertura = false;
    this.tallerCobertura = null;
    this.errorCobertura = '';
    this.resultadoCobertura = null;
    this.formCobertura = this.getCoberturaInicial();
    this.puntoVerificacion = { latitud: 0, longitud: 0 };
    this.destruirMapaCobertura();
  }

  abrirMapa(): void {
    this.mostrarMapa = true;
    setTimeout(() => this.inicializarMapa(), 300);
  }

  cerrarMapa(): void {
    this.mostrarMapa = false;
    this.destruirMapa();
  }

  private inicializarMapa(): void {
    const contenedor = document.getElementById('mapa-leaflet');
    if (!contenedor) return;

    this.destruirMapa();

    const latInicial = this.form.latitud !== 0 ? this.form.latitud : -17.7833;
    const lngInicial = this.form.longitud !== 0 ? this.form.longitud : -63.1821;

    this.mapa = L.map('mapa-leaflet').setView([latInicial, lngInicial], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.mapa);

    if (this.form.latitud !== 0 && this.form.longitud !== 0) {
      this.colocarMarcador(this.form.latitud, this.form.longitud);
    }

    this.mapa.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.colocarMarcador(lat, lng);
      this.obtenerDireccion(lat, lng);
    });

    setTimeout(() => {
      this.mapa?.invalidateSize();
    }, 200);
  }

  private inicializarMapaCobertura(): void {
    const contenedor = document.getElementById('mapa-cobertura');
    if (!contenedor || !this.tallerCobertura) return;

    this.destruirMapaCobertura();

    const lat = Number(this.tallerCobertura.latitud || 0);
    const lng = Number(this.tallerCobertura.longitud || 0);
    const centro: L.LatLngExpression = [
      lat || -17.7833,
      lng || -63.1821
    ];

    this.mapaCobertura = L.map('mapa-cobertura').setView(centro, 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.mapaCobertura);

    this.marcadorTallerCobertura = L.marker(centro)
      .addTo(this.mapaCobertura)
      .bindPopup(this.tallerCobertura.nombre);

    this.actualizarCirculoCobertura();

    if (this.puntoVerificacion.latitud && this.puntoVerificacion.longitud) {
      this.colocarMarcadorVerificacion(this.puntoVerificacion.latitud, this.puntoVerificacion.longitud);
    }

    this.mapaCobertura.on('click', (e: L.LeafletMouseEvent) => {
      this.puntoVerificacion = {
        latitud: Number(e.latlng.lat.toFixed(7)),
        longitud: Number(e.latlng.lng.toFixed(7))
      };
      this.resultadoCobertura = null;
      this.colocarMarcadorVerificacion(this.puntoVerificacion.latitud, this.puntoVerificacion.longitud);
    });

    setTimeout(() => this.mapaCobertura?.invalidateSize(), 200);
  }

  private colocarMarcador(lat: number, lng: number): void {
    if (!this.mapa) return;

    if (this.marcador) {
      this.marcador.setLatLng([lat, lng]);
    } else {
      this.marcador = L.marker([lat, lng], { draggable: true }).addTo(this.mapa);
      this.marcador.on('dragend', (e: any) => {
        const pos = e.target.getLatLng();
        this.colocarMarcador(pos.lat, pos.lng);
        this.obtenerDireccion(pos.lat, pos.lng);
      });
    }

    this.form.latitud = parseFloat(lat.toFixed(7));
    this.form.longitud = parseFloat(lng.toFixed(7));
  }

  private colocarMarcadorVerificacion(lat: number, lng: number): void {
    if (!this.mapaCobertura) return;

    const posicion: L.LatLngExpression = [lat, lng];
    if (this.marcadorVerificacion) {
      this.marcadorVerificacion.setLatLng(posicion);
    } else {
      this.marcadorVerificacion = L.marker(posicion, { draggable: true }).addTo(this.mapaCobertura);
      this.marcadorVerificacion.on('dragend', (e: any) => {
        const pos = e.target.getLatLng();
        this.puntoVerificacion = {
          latitud: Number(pos.lat.toFixed(7)),
          longitud: Number(pos.lng.toFixed(7))
        };
        this.resultadoCobertura = null;
        this.colocarMarcadorVerificacion(this.puntoVerificacion.latitud, this.puntoVerificacion.longitud);
      });
    }
  }

  actualizarCirculoCobertura(): void {
    if (!this.mapaCobertura || !this.tallerCobertura) return;

    const lat = Number(this.tallerCobertura.latitud || 0) || -17.7833;
    const lng = Number(this.tallerCobertura.longitud || 0) || -63.1821;
    const radioMetros = Math.max(Number(this.formCobertura.radio_km) || 0, 0) * 1000;
    const color = this.formCobertura.activo ? '#ff6b35' : '#8b949e';

    if (this.circuloCobertura) {
      this.circuloCobertura.setLatLng([lat, lng]);
      this.circuloCobertura.setRadius(radioMetros);
      this.circuloCobertura.setStyle({
        color,
        fillColor: color,
        opacity: this.formCobertura.activo ? 1 : 0.35,
        fillOpacity: this.formCobertura.activo ? 0.18 : 0.06
      });
    } else {
      this.circuloCobertura = L.circle([lat, lng], {
        radius: radioMetros,
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: this.formCobertura.activo ? 0.18 : 0.06
      }).addTo(this.mapaCobertura);
    }
  }

  private async obtenerDireccion(lat: number, lng: number): Promise<void> {
    this.loadingDireccion = true;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'es' } }
      );
      const data = await response.json();
      const address = data?.address || {};

      const partes = [
        address.road || address.pedestrian || address.footway || address.path,
        address.house_number,
        address.neighbourhood || address.suburb || address.city_district,
        address.city || address.town || address.village,
        address.state
      ].filter(Boolean);

      this.form.direccion = partes.join(', ') ||
        data?.display_name?.split(',').slice(0, 5).join(', ') ||
        `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
    } catch (error) {
      console.error('Error al obtener dirección:', error);
      this.form.direccion = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
    } finally {
      this.loadingDireccion = false;
    }
  }

  confirmarUbicacion(): void {
    if (this.form.latitud === 0 && this.form.longitud === 0) {
      alert('Por favor selecciona una ubicación en el mapa');
      return;
    }
    if (!this.form.direccion?.trim()) {
      this.form.direccion = `Lat: ${this.form.latitud.toFixed(5)}, Lng: ${this.form.longitud.toFixed(5)}`;
    }
    this.cerrarMapa();
  }

  private destruirMapa(): void {
    if (this.mapa) {
      this.mapa.remove();
      this.mapa = null;
      this.marcador = null;
    }
  }

  private destruirMapaCobertura(): void {
    if (this.mapaCobertura) {
      this.mapaCobertura.remove();
      this.mapaCobertura = null;
      this.marcadorTallerCobertura = null;
      this.circuloCobertura = null;
      this.marcadorVerificacion = null;
    }
  }

  private corregirIconosLeaflet(): void {
    const iconDefault = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;
  }

  guardar(): void {
    if (!this.form.nombre.trim() || !this.form.telefono.trim() || !this.form.direccion.trim()) {
      this.error = 'Completa nombre, teléfono y dirección';
      return;
    }

    if (this.form.latitud === 0 && this.form.longitud === 0) {
      this.error = 'Selecciona la ubicación del taller en el mapa';
      return;
    }

    this.loading = true;
    this.error = '';

    const payload: TallerCreate = {
      nombre: this.form.nombre.trim(),
      telefono: this.form.telefono.trim(),
      direccion: this.form.direccion.trim(),
      latitud: this.form.latitud,
      longitud: this.form.longitud,
      horario_inicio: this.form.horario_inicio?.trim() || '08:00',
      horario_fin: this.form.horario_fin?.trim() || '18:00',
      usuario_id: this.form.usuario_id
    };

    const accion = this.editando
      ? this.tallerService.actualizar(this.editando.codigo, payload)
      : this.tallerService.crear(payload);

    accion.subscribe({
      
      next: (tallerGuardado) => {
         this.loading = false;
        if (this.editando) {
          this.talleres = this.talleres.map(t =>
            t.codigo === tallerGuardado.codigo ? tallerGuardado : t
          );
        } else {
          this.talleres = [...this.talleres, tallerGuardado];
        }
        this.cerrarModal();
        this.form = this.getFormInicial();
        console.log('Taller guardado:', tallerGuardado);
      },
      error: (err) => {
        this.error = err.error?.detail || 'Error al guardar taller';
        this.loading = false;
        console.error('Error al guardar taller:', err);
      }
    });
  }

  guardarCobertura(): void {
    if (!this.tallerCobertura) return;

    const radio = Number(this.formCobertura.radio_km);
    if (!radio || radio <= 0) {
      this.errorCobertura = 'El radio de cobertura debe ser mayor a 0 km';
      return;
    }

    this.guardandoCobertura = true;
    this.errorCobertura = '';

    this.tallerService.actualizarCobertura(this.tallerCobertura.codigo, {
      codigo_taller: this.tallerCobertura.codigo,
      nombre_taller: this.tallerCobertura.nombre,
      latitud: Number(this.tallerCobertura.latitud),
      longitud: Number(this.tallerCobertura.longitud),
      radio_cobertura_km: radio
    }).subscribe({
      next: (cobertura) => {
        this.formCobertura = {
          radio_km: cobertura.radio_km,
          activo: cobertura.activo
        };
        this.guardandoCobertura = false;
        this.resultadoCobertura = null;
        this.actualizarCirculoCobertura();
      },
      error: (err) => {
        console.error('Error al guardar cobertura:', err);
        this.errorCobertura = err.error?.detail || 'Error al guardar cobertura';
        this.guardandoCobertura = false;
      }
    });
  }

  verificarCobertura(): void {
    if (!this.tallerCobertura) return;

    const lat = Number(this.puntoVerificacion.latitud);
    const lng = Number(this.puntoVerificacion.longitud);

    if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      this.errorCobertura = 'Ingresa coordenadas válidas para verificar la cobertura';
      return;
    }

    this.verificandoCobertura = true;
    this.errorCobertura = '';
    this.resultadoCobertura = null;
    this.colocarMarcadorVerificacion(lat, lng);

    this.tallerService.verificarCobertura(this.tallerCobertura.codigo, lat, lng).subscribe({
      next: (resultado) => {
        this.resultadoCobertura = resultado;
        this.verificandoCobertura = false;
      },
      error: (err) => {
        console.error('Error al verificar cobertura:', err);
        this.errorCobertura = err.error?.detail || 'Error al verificar cobertura';
        this.verificandoCobertura = false;
      }
    });
  }

  desactivar(codigo: number): void {
    if (!confirm('¿Desactivar este taller?')) return;
    this.tallerService.desactivar(codigo).subscribe({
      next: () => this.cargarTalleres(),
      error: (err) => {
        console.error('Error al desactivar:', err);
        this.error = err.error?.detail || 'Error al desactivar taller';
      }
    });
  }

  getEstadoClase(estado: string | null | undefined): string {
    switch ((estado || '').toLowerCase()) {
      case 'aprobado':
      case 'aceptado':
        return 'estado-aprobado';
      case 'rechazado':
        return 'estado-rechazado';
      default:
        return 'estado-pendiente';
    }
  }

  formatFecha(fecha?: string | null): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return isNaN(d.getTime()) ? String(fecha) : d.toLocaleString();
  }

  formatHorario(hora?: string | null): string {
    if (!hora) return '—';
    return String(hora).slice(0, 5);
  }
}
