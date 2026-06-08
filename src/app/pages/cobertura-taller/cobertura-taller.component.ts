import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import * as L from 'leaflet';

import { TallerService } from '../../core/services/taller.service';
import { CoberturaVerificacion, Taller } from '../../models/taller.model';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-cobertura-taller',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, RouterLink],
  templateUrl: './cobertura-taller.component.html',
  styleUrls: ['./cobertura-taller.component.scss']
})
export class CoberturaTallerComponent implements OnInit, OnDestroy {
  idTaller = 0;
  taller: Taller | null = null;
  loading = true;
  guardando = false;
  verificando = false;
  error = '';
  mensajeExito = '';
  resultado: CoberturaVerificacion | null = null;

  form = {
    radio_km: 5,
    activo: true
  };

  punto = {
    latitud: 0,
    longitud: 0
  };

  private mapa: L.Map | null = null;
  private marcadorTaller: L.Marker | null = null;
  private marcadorPunto: L.Marker | null = null;
  private circulo: L.Circle | null = null;

  constructor(private tallerService: TallerService) {}

  ngOnInit(): void {
    this.corregirIconosLeaflet();
    this.idTaller = Number(localStorage.getItem('id_taller') || 0);

    if (!this.idTaller) {
      this.loading = false;
      this.error = 'No se encontro el taller del usuario logueado';
      return;
    }

    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destruirMapa();
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = '';
    this.mensajeExito = '';

    this.tallerService.obtener(this.idTaller).subscribe({
      next: (taller) => {
        this.taller = taller;
        this.punto = {
          latitud: taller.latitud,
          longitud: taller.longitud
        };
        this.cargarCobertura();
      },
      error: (err) => {
        console.error('Error al cargar taller:', err);
        this.error = err.status === 403
          ? 'No tienes permiso para acceder a la información de este taller.'
          : err.error?.detail || 'No se pudo cargar la informacion del taller';
        this.loading = false;
      }
    });
  }

  cargarCobertura(): void {
    this.tallerService.obtenerCobertura(this.idTaller).subscribe({
      next: (cobertura) => {
        this.form = {
          radio_km: cobertura.radio_km > 0 ? cobertura.radio_km : 5,
          activo: cobertura.activo
        };
        this.loading = false;
        setTimeout(() => this.inicializarMapa(), 250);
      },
      error: (err) => {
        console.error('Error al cargar cobertura:', err);
        this.error = err.status === 403
          ? 'No tienes permiso para acceder a la información de este taller.'
          : err.error?.detail || 'No se pudo cargar la cobertura. Puedes guardar una configuracion nueva.';
        this.loading = false;
        setTimeout(() => this.inicializarMapa(), 250);
      }
    });
  }

  guardar(): void {
    const radio = Number(this.form.radio_km);

    if (!radio || radio <= 0) {
      this.error = 'El radio de cobertura debe ser mayor a 0 km';
      return;
    }

    this.guardando = true;
    this.error = '';
    this.mensajeExito = '';
    this.resultado = null;

    if (!this.taller) {
      this.error = 'No se encontro la informacion del taller';
      this.guardando = false;
      return;
    }

    this.tallerService.actualizarCobertura(this.idTaller, {
      codigo_taller: this.taller.codigo,
      nombre_taller: this.taller.nombre,
      latitud: Number(this.taller.latitud),
      longitud: Number(this.taller.longitud),
      radio_cobertura_km: radio
    }).subscribe({
      next: (cobertura) => {
        this.form = {
          radio_km: cobertura.radio_km,
          activo: cobertura.activo
        };
        this.mensajeExito = 'Cobertura guardada correctamente.';
        this.guardando = false;
        this.actualizarCirculo();
        setTimeout(() => this.mapa?.invalidateSize(), 150);
      },
      error: (err) => {
        console.error('Error al guardar cobertura:', err);
        this.error = err.status === 403
          ? 'No tienes permiso para acceder a la información de este taller.'
          : err.error?.detail || 'Error al guardar cobertura';
        this.guardando = false;
      }
    });
  }

  verificar(): void {
    const lat = Number(this.punto.latitud);
    const lng = Number(this.punto.longitud);

    if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      this.error = 'Ingresa coordenadas validas para verificar cobertura';
      return;
    }

    this.verificando = true;
    this.error = '';
    this.resultado = null;
    this.colocarMarcadorPunto(lat, lng);

    this.tallerService.verificarCobertura(this.idTaller, lat, lng).subscribe({
      next: (resultado) => {
        this.resultado = resultado;
        this.verificando = false;
      },
      error: (err) => {
        console.error('Error al verificar cobertura:', err);
        this.error = err.status === 403
          ? 'No tienes permiso para acceder a la información de este taller.'
          : err.error?.detail || 'Error al verificar cobertura';
        this.verificando = false;
      }
    });
  }

  actualizarCirculo(): void {
    if (!this.mapa || !this.taller) return;

    const lat = Number(this.taller.latitud || 0) || -17.7833;
    const lng = Number(this.taller.longitud || 0) || -63.1821;
    const color = this.form.activo ? '#ff6b35' : '#8b949e';
    const radioMetros = Math.max(Number(this.form.radio_km) || 0, 0) * 1000;

    if (this.circulo) {
      this.circulo.setLatLng([lat, lng]);
      this.circulo.setRadius(radioMetros);
      this.circulo.setStyle({
        color,
        fillColor: color,
        opacity: this.form.activo ? 1 : 0.35,
        fillOpacity: this.form.activo ? 0.18 : 0.06
      });
      return;
    }

    this.circulo = L.circle([lat, lng], {
      radius: radioMetros,
      color,
      weight: 2,
      fillColor: color,
      fillOpacity: this.form.activo ? 0.18 : 0.06
    }).addTo(this.mapa);
  }

  private inicializarMapa(): void {
    const contenedor = document.getElementById('mapa-cobertura-taller');
    if (!contenedor || !this.taller) return;

    this.destruirMapa();

    const lat = Number(this.taller.latitud || 0) || -17.7833;
    const lng = Number(this.taller.longitud || 0) || -63.1821;

    this.mapa = L.map('mapa-cobertura-taller').setView([lat, lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.mapa);

    this.marcadorTaller = L.marker([lat, lng])
      .addTo(this.mapa)
      .bindPopup(this.taller.nombre);

    this.actualizarCirculo();
    this.colocarMarcadorPunto(this.punto.latitud, this.punto.longitud);

    this.mapa.on('click', (e: L.LeafletMouseEvent) => {
      this.punto = {
        latitud: Number(e.latlng.lat.toFixed(7)),
        longitud: Number(e.latlng.lng.toFixed(7))
      };
      this.resultado = null;
      this.colocarMarcadorPunto(this.punto.latitud, this.punto.longitud);
    });

    setTimeout(() => this.mapa?.invalidateSize(), 0);
    setTimeout(() => this.mapa?.invalidateSize(), 250);
    setTimeout(() => this.mapa?.invalidateSize(), 700);
  }

  private colocarMarcadorPunto(lat: number, lng: number): void {
    if (!this.mapa || !lat || !lng) return;

    if (this.marcadorPunto) {
      this.marcadorPunto.setLatLng([lat, lng]);
      return;
    }

    this.marcadorPunto = L.marker([lat, lng], { draggable: true }).addTo(this.mapa);
    this.marcadorPunto.on('dragend', (e: any) => {
      const pos = e.target.getLatLng();
      this.punto = {
        latitud: Number(pos.lat.toFixed(7)),
        longitud: Number(pos.lng.toFixed(7))
      };
      this.resultado = null;
      this.colocarMarcadorPunto(this.punto.latitud, this.punto.longitud);
    });
  }

  private destruirMapa(): void {
    if (!this.mapa) return;
    this.mapa.remove();
    this.mapa = null;
    this.marcadorTaller = null;
    this.marcadorPunto = null;
    this.circulo = null;
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
}
