import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CotizacionService } from '../../core/services/cotizacion.service';
import {
  EstadoCotizacion,
  ResponderCotizacionPayload,
  SolicitudCotizacion
} from '../../models/cotizacion.model';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-cotizaciones-taller',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, NavbarComponent],
  templateUrl: './cotizaciones-taller.component.html',
  styleUrls: ['./cotizaciones-taller.component.scss']
})
export class CotizacionesTallerComponent implements OnInit {
  solicitudes: SolicitudCotizacion[] = [];
  loading = true;
  accionLoading = false;
  error = '';
  mensajeExito = '';
  filtroEstado = 'TODAS';

  mostrarResponder = false;
  mostrarRechazar = false;
  solicitudSeleccionada: SolicitudCotizacion | null = null;

  respuesta: ResponderCotizacionPayload = this.respuestaInicial();
  observacionRechazo = '';

  readonly estados: Array<'TODAS' | EstadoCotizacion> = [
    'TODAS',
    'INVITADA',
    'ENVIADA',
    'ACEPTADA',
    'RECHAZADA',
    'VENCIDA',
    'AJUSTE_SOLICITADO',
    'RETIRADA'
  ];

  constructor(private cotizacionService: CotizacionService) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.loading = true;
    this.error = '';

    this.cotizacionService.listarMisSolicitudes().subscribe({
      next: solicitudes => {
        this.solicitudes = (solicitudes || []).sort((a, b) => {
          const fechaA = new Date(this.getFechaLimite(a) || a.fecha_invitacion || '').getTime() || 0;
          const fechaB = new Date(this.getFechaLimite(b) || b.fecha_invitacion || '').getTime() || 0;
          return fechaB - fechaA;
        });
        this.loading = false;
      },
      error: err => {
        console.error('ERROR COTIZACIONES:', err);
        this.error = err.status === 403
          ? 'No tienes permiso para consultar las cotizaciones de este taller.'
          : this.getMensajeError(err, 'No se pudieron cargar las invitaciones de cotizacion.');
        this.loading = false;
      }
    });
  }

  get solicitudesFiltradas(): SolicitudCotizacion[] {
    if (this.filtroEstado === 'TODAS') return this.solicitudes;
    return this.solicitudes.filter(item => this.getEstado(item) === this.filtroEstado);
  }

  get totalPendientes(): number {
    return this.solicitudes.filter(item =>
      ['INVITADA', 'AJUSTE_SOLICITADO'].includes(this.getEstado(item)) && !this.estaVencida(item)
    ).length;
  }

  get totalEnviadas(): number {
    return this.solicitudes.filter(item => this.getEstado(item) === 'ENVIADA').length;
  }

  get totalAceptadas(): number {
    return this.solicitudes.filter(item => this.getEstado(item) === 'ACEPTADA').length;
  }

  abrirResponder(item: SolicitudCotizacion): void {
    if (!this.puedeResponder(item)) return;

    this.solicitudSeleccionada = item;
    this.respuesta = {
      monto_estimado: Number(item.monto_estimado || 0),
      tiempo_llegada_minutos: Number(item.tiempo_llegada_minutos || 0),
      tiempo_reparacion_minutos: Number(item.tiempo_reparacion_minutos || 0),
      descripcion_servicio: item.descripcion_servicio || '',
      id_tecnico: item.id_tecnico || null,
      observacion: item.observacion || ''
    };
    this.error = '';
    this.mensajeExito = '';
    this.mostrarResponder = true;
  }

  cerrarResponder(): void {
    this.mostrarResponder = false;
    this.solicitudSeleccionada = null;
    this.respuesta = this.respuestaInicial();
  }

  enviarCotizacion(): void {
    if (!this.solicitudSeleccionada) return;

    const idSolicitud = this.getIdSolicitud(this.solicitudSeleccionada);
    if (!idSolicitud) {
      this.error = 'La invitacion no tiene un identificador valido.';
      return;
    }

    if (
      Number(this.respuesta.monto_estimado) <= 0 ||
      Number(this.respuesta.tiempo_llegada_minutos) <= 0 ||
      Number(this.respuesta.tiempo_reparacion_minutos) <= 0 ||
      !this.respuesta.descripcion_servicio.trim()
    ) {
      this.error = 'Completa monto, tiempos y descripcion del servicio.';
      return;
    }

    if (this.estaVencida(this.solicitudSeleccionada)) {
      this.error = 'La fecha limite de esta invitacion ya vencio.';
      return;
    }

    this.accionLoading = true;
    this.error = '';

    this.cotizacionService.responder(idSolicitud, {
      monto_estimado: Number(this.respuesta.monto_estimado),
      tiempo_llegada_minutos: Number(this.respuesta.tiempo_llegada_minutos),
      tiempo_reparacion_minutos: Number(this.respuesta.tiempo_reparacion_minutos),
      descripcion_servicio: this.respuesta.descripcion_servicio.trim(),
      id_tecnico: this.respuesta.id_tecnico?.trim() || null,
      observacion: this.respuesta.observacion?.trim() || undefined
    }).subscribe({
      next: resp => {
        this.mensajeExito = resp?.mensaje || 'Cotizacion enviada correctamente.';
        this.accionLoading = false;
        this.cerrarResponder();
        this.cargarSolicitudes();
      },
      error: err => {
        console.error('ERROR RESPONDER COTIZACION:', err);
        this.error = this.getMensajeError(err, 'No se pudo enviar la cotizacion.');
        this.accionLoading = false;
      }
    });
  }

  abrirRechazar(item: SolicitudCotizacion): void {
    if (!this.puedeResponder(item)) return;

    this.solicitudSeleccionada = item;
    this.observacionRechazo = '';
    this.error = '';
    this.mensajeExito = '';
    this.mostrarRechazar = true;
  }

  cerrarRechazar(): void {
    this.mostrarRechazar = false;
    this.solicitudSeleccionada = null;
    this.observacionRechazo = '';
  }

  rechazarCotizacion(): void {
    if (!this.solicitudSeleccionada) return;

    const idSolicitud = this.getIdSolicitud(this.solicitudSeleccionada);
    if (!idSolicitud || !this.observacionRechazo.trim()) {
      this.error = 'Escribe el motivo del rechazo.';
      return;
    }

    if (this.estaVencida(this.solicitudSeleccionada)) {
      this.error = 'La fecha limite de esta invitacion ya vencio.';
      return;
    }

    this.accionLoading = true;
    this.error = '';

    this.cotizacionService.rechazar(idSolicitud, {
      observacion: this.observacionRechazo.trim()
    }).subscribe({
      next: resp => {
        this.mensajeExito = resp?.mensaje || 'Invitacion rechazada correctamente.';
        this.accionLoading = false;
        this.cerrarRechazar();
        this.cargarSolicitudes();
      },
      error: err => {
        console.error('ERROR RECHAZAR COTIZACION:', err);
        this.error = this.getMensajeError(err, 'No se pudo rechazar la invitacion.');
        this.accionLoading = false;
      }
    });
  }

  verUbicacion(item: SolicitudCotizacion): void {
    const latitud = this.getLatitud(item);
    const longitud = this.getLongitud(item);
    if (!latitud || !longitud) return;

    window.open(`https://www.google.com/maps?q=${latitud},${longitud}`, '_blank');
  }

  puedeResponder(item: SolicitudCotizacion): boolean {
    const estado = this.getEstado(item);
    return ['INVITADA', 'AJUSTE_SOLICITADO'].includes(estado) && !this.estaVencida(item);
  }

  estaVencida(item: SolicitudCotizacion): boolean {
    if (this.getEstado(item) === 'VENCIDA') return true;
    const fechaLimite = this.getFechaLimite(item);
    if (!fechaLimite) return false;
    return new Date(fechaLimite).getTime() < Date.now();
  }

  getIdSolicitud(item: SolicitudCotizacion): number {
    const idSolicitud = item.solicitud?.id || item.id_solicitud || item.cotizacion?.id_solicitud;
    if (idSolicitud) return Number(idSolicitud);

    const pareceCotizacion = Boolean(item.cotizacion?.id || item.monto_estimado || item.fecha_respuesta);
    return Number(pareceCotizacion ? 0 : item.id || item.codigo || 0);
  }

  getIdIncidente(item: SolicitudCotizacion): number {
    return Number(item.solicitud?.id_incidente || item.id_incidente || item.incidente?.id_incidente || item.incidente?.codigo || item.incidente?.id || 0);
  }

  getEstado(item: SolicitudCotizacion): string {
    return String(item.cotizacion?.estado || item.estado || item.solicitud?.estado || 'INVITADA').toUpperCase();
  }

  getDescripcion(item: SolicitudCotizacion): string {
    return item.incidente?.descripcion || item.descripcion || 'Sin descripcion del incidente.';
  }

  getCategoria(item: SolicitudCotizacion): string {
    return item.incidente?.categoria || item.categoria || 'Emergencia vehicular';
  }

  getDireccion(item: SolicitudCotizacion): string {
    return item.incidente?.direccion || item.direccion || 'Ubicacion por coordenadas';
  }

  getLatitud(item: SolicitudCotizacion): number {
    return Number(item.incidente?.latitud || item.latitud || 0);
  }

  getLongitud(item: SolicitudCotizacion): number {
    return Number(item.incidente?.longitud || item.longitud || 0);
  }

  getFechaLimite(item: SolicitudCotizacion): string {
    return item.solicitud?.fecha_vencimiento ||
      item.solicitud?.fecha_limite ||
      item.cotizacion?.fecha_vencimiento ||
      item.fecha_vencimiento ||
      item.fecha_limite ||
      '';
  }

  estadoClase(estado: string): string {
    return `estado-${String(estado || '').toLowerCase().replace('_', '-')}`;
  }

  estadoTexto(estado: string): string {
    const textos: Record<string, string> = {
      INVITADA: 'Invitada',
      ENVIADA: 'Enviada',
      ACEPTADA: 'Aceptada',
      RECHAZADA: 'Rechazada',
      VENCIDA: 'Vencida',
      AJUSTE_SOLICITADO: 'Ajuste solicitado',
      RETIRADA: 'Retirada'
    };
    return textos[estado] || estado;
  }

  private respuestaInicial(): ResponderCotizacionPayload {
    return {
      monto_estimado: 0,
      tiempo_llegada_minutos: 0,
      tiempo_reparacion_minutos: 0,
      descripcion_servicio: '',
      id_tecnico: null,
      observacion: ''
    };
  }

  private getMensajeError(err: any, fallback: string): string {
    const detail = err?.error?.detail || err?.error?.mensaje || err?.message;
    if (!detail) return fallback;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail
        .map(item => item?.msg || item?.message || JSON.stringify(item))
        .join(' ');
    }
    return detail?.msg || detail?.message || fallback;
  }
}
