import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import * as L from 'leaflet';

import { NavbarComponent } from '../../shared/navbar/navbar.component';
import {
  AccionProgresoTecnico,
  ProgresoTecnicoPayload,
  TecnicoDashboardService,
  ValidarArriboPayload
} from '../../core/services/dashboardTecnico.service';
import { TrackingService } from '../../core/services/tracking.service';
import { ChatMensaje, ChatService } from '../../core/services/chat.service';
import {
  ComprobantePago,
  ConceptoCobro,
  PagoService,
  ResumenCobro
} from '../../core/services/pago.service';

interface PasoProgreso {
  accion: AccionProgresoTecnico;
  titulo: string;
  descripcion: string;
  estadoObjetivo: number;
  estadosPermitidos: number[];
}

@Component({
  selector: 'app-tecnico-incidentes',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, RouterLink, NavbarComponent],
  templateUrl: './tecnico_incidente.component.html',
  styleUrl: './tecnico_incidente.component.scss'
})
export class TecnicoIncidentesComponent implements OnInit, OnDestroy {
  loading = true;
  error = '';
  mensajeExito = '';
  progresoLoading = '';
  validandoArribo = false;
  observacion = '';
  modoValidacion: 'pin' | 'qr' = 'pin';
  pinArribo = '';
  qrTokenArribo = '';
  chatMensajes: ChatMensaje[] = [];
  chatTexto = '';
  chatLoading = false;
  enviandoChat = false;
  chatError = '';
  chatConectado = false;
  conceptosCobro: ConceptoCobro[] = [];
  conceptosSeleccionados: Record<number, { seleccionado: boolean; cantidad: number; observacion: string }> = {};
  resumenCobro: ResumenCobro | null = null;
  comprobantePago: ComprobantePago | null = null;
  loadingPagos = false;
  guardandoCobro = false;
  errorPagos = '';

  incidenteActual: any | null = null;
  lineaTiempo: any[] = [];
  intervalUbicacion: any = null;

  private mapa: L.Map | null = null;
  private marcadorCliente: L.Marker | null = null;
  private marcadorTecnico: L.Marker | null = null;
  private lineaRuta: L.Polyline | null = null;
  private chatSocket: WebSocket | null = null;
  private chatReconnectTimer: any = null;
  private chatRefreshTimer: any = null;
  private chatDebeReconectar = false;

  pasosProgreso: PasoProgreso[] = [
    {
      accion: 'aceptar',
      titulo: 'Aceptar servicio',
      descripcion: 'Confirma que tomaras el caso asignado.',
      estadoObjetivo: 9,
      estadosPermitidos: [4]
    },
    {
      accion: 'en-camino',
      titulo: 'Marcar en camino',
      descripcion: 'Inicia la ruta hacia el cliente y activa el tracking.',
      estadoObjetivo: 5,
      estadosPermitidos: [9]
    },
    {
      accion: 'llegada',
      titulo: 'Registrar llegada',
      descripcion: 'Informa que llegaste al lugar del incidente.',
      estadoObjetivo: 10,
      estadosPermitidos: [5]
    },
    {
      accion: 'iniciar-atencion',
      titulo: 'Iniciar atencion',
      descripcion: 'Marca el inicio del trabajo tecnico.',
      estadoObjetivo: 11,
      estadosPermitidos: [10]
    },
    {
      accion: 'finalizar',
      titulo: 'Finalizar servicio',
      descripcion: 'Cierra el servicio y detiene el tracking.',
      estadoObjetivo: 6,
      estadosPermitidos: [11]
    }
  ];

  constructor(
    private tecnicoService: TecnicoDashboardService,
    private trackingService: TrackingService,
    private chatService: ChatService,
    private pagoService: PagoService
  ) {}

  ngOnInit(): void {
    this.corregirIconosLeaflet();
    this.cargarIncidenteActual();
  }

  ngOnDestroy(): void {
    this.detenerTrackingUbicacion();
    this.destruirMapa();
    this.cerrarChatSocket();
  }

  cargarIncidenteActual(): void {
    this.loading = true;
    this.error = '';

    this.tecnicoService.obtenerAsignacionActual().subscribe({
      next: (data: any | null) => {
        this.incidenteActual = data;
        this.loading = false;

        if (this.incidenteActual?.id_incidente) {
          this.cargarLineaTiempo();
          this.iniciarChat();
          this.cargarPagos();
          setTimeout(() => this.inicializarMapa(), 250);
        } else {
          this.lineaTiempo = [];
          this.chatMensajes = [];
          this.resumenCobro = null;
          this.comprobantePago = null;
          this.detenerTrackingUbicacion();
          this.cerrarChatSocket();
          this.destruirMapa();
        }
      },
      error: (err: any) => {
        console.error('ERROR INCIDENTE ACTUAL:', err);
        this.error = err.error?.detail || 'No se pudo cargar el incidente actual.';
        this.loading = false;
      }
    });
  }

  cargarLineaTiempo(): void {
    const idIncidente = Number(this.incidenteActual?.id_incidente || 0);
    if (!idIncidente) return;

    this.tecnicoService.obtenerLineaTiempo(idIncidente).subscribe({
      next: (data) => {
        this.lineaTiempo = data || [];
      },
      error: (err) => {
        console.error('ERROR LINEA TIEMPO:', err);
        this.lineaTiempo = [];
      }
    });
  }

  cargarPagos(): void {
    const idIncidente = Number(this.incidenteActual?.id_incidente || 0);
    const token = this.getToken();
    if (!idIncidente || !token) return;

    this.loadingPagos = true;
    this.errorPagos = '';

    this.pagoService.listarConceptos().subscribe({
      next: (conceptos) => {
        this.conceptosCobro = (conceptos || []).filter(c => c.activo);
        this.inicializarSeleccionConceptos();
        this.cargarResumenCobro(idIncidente, token);
      },
      error: (err) => {
        console.error('ERROR CONCEPTOS COBRO:', err);
        this.errorPagos = err.error?.detail || 'No se pudieron cargar los conceptos de cobro.';
        this.loadingPagos = false;
      }
    });
  }

  cargarResumenCobro(idIncidente = Number(this.incidenteActual?.id_incidente || 0), token = this.getToken()): void {
    if (!idIncidente || !token) {
      this.loadingPagos = false;
      return;
    }

    this.pagoService.obtenerResumen(idIncidente, token).subscribe({
      next: (resumen) => {
        this.resumenCobro = resumen;
        this.loadingPagos = false;
        if (resumen?.estado_pago === 'PAGADO' || resumen?.estado_pago === 'COMPROBANTE_GENERADO') {
          this.cargarComprobantePago();
        }
      },
      error: () => {
        this.resumenCobro = null;
        this.loadingPagos = false;
      }
    });
  }

  cargarComprobantePago(): void {
    const idIncidente = Number(this.incidenteActual?.id_incidente || 0);
    const token = this.getToken();
    if (!idIncidente || !token) return;

    this.pagoService.obtenerComprobante(idIncidente, token).subscribe({
      next: (comprobante) => {
        this.comprobantePago = comprobante;
      },
      error: () => {
        this.comprobantePago = null;
      }
    });
  }

  guardarConceptosCobro(): void {
    const idIncidente = Number(this.incidenteActual?.id_incidente || 0);
    const token = this.getToken();
    const conceptos = Object.entries(this.conceptosSeleccionados)
      .filter(([, item]) => item.seleccionado)
      .map(([id, item]) => ({
        id_concepto: Number(id),
        cantidad: Number(item.cantidad) || 1,
        observacion: item.observacion?.trim() || undefined
      }));

    if (!idIncidente || !token) return;

    if (conceptos.length === 0) {
      this.errorPagos = 'Selecciona al menos un concepto realizado.';
      return;
    }

    if (conceptos.some(c => c.cantidad <= 0)) {
      this.errorPagos = 'La cantidad de cada concepto debe ser mayor a 0.';
      return;
    }

    this.guardandoCobro = true;
    this.errorPagos = '';

    this.pagoService.registrarConceptos(idIncidente, token, {
      conceptos,
      descuento: 0
    }).subscribe({
      next: (resumen) => {
        this.resumenCobro = resumen;
        this.mensajeExito = 'Cobro generado correctamente.';
        this.cargarComprobantePago();
        this.guardandoCobro = false;
      },
      error: (err) => {
        console.error('ERROR REGISTRAR COBRO:', err);
        this.errorPagos = err.error?.detail || 'No se pudo registrar el cobro.';
        this.guardandoCobro = false;
      }
    });
  }

  private inicializarSeleccionConceptos(): void {
    const actual = this.conceptosSeleccionados;
    this.conceptosSeleccionados = {};

    for (const concepto of this.conceptosCobro) {
      this.conceptosSeleccionados[concepto.id] = actual[concepto.id] || {
        seleccionado: false,
        cantidad: 1,
        observacion: ''
      };
    }
  }

  iniciarChat(): void {
    const idIncidente = Number(this.incidenteActual?.id_incidente || 0);
    const token = this.getToken();

    if (!idIncidente || !token) {
      this.chatError = 'No se pudo iniciar el chat: faltan datos de sesion.';
      return;
    }

    this.cargarHistorialChat(idIncidente, token);
    this.conectarChatSocket(idIncidente, token);
  }

  cargarHistorialChat(idIncidente?: number, token?: string, silencioso = false): void {
    const id = idIncidente || Number(this.incidenteActual?.id_incidente || 0);
    const tokenActual = token || this.getToken();

    if (!id || !tokenActual) return;

    if (!silencioso) {
      this.chatLoading = true;
      this.chatError = '';
    }

    this.chatService.obtenerMensajes(id, tokenActual).subscribe({
      next: (mensajes) => {
        this.chatMensajes = mensajes || [];
        if (!silencioso) {
          this.chatLoading = false;
          setTimeout(() => this.scrollChatAlFinal(), 80);
        }
      },
      error: (err) => {
        console.error('ERROR HISTORIAL CHAT:', err);
        if (!silencioso) {
          this.chatError = err.name === 'TimeoutError'
            ? 'El historial del chat esta tardando demasiado. Se volvera a intentar cada 5 segundos.'
            : err.error?.detail || 'No se pudo cargar el historial del chat.';
          this.chatLoading = false;
        }
      }
    });
  }

  conectarChatSocket(idIncidente: number, token: string): void {
    this.cerrarChatSocket(false);
    this.chatDebeReconectar = true;
    this.chatError = '';

    try {
      this.chatSocket = new WebSocket(this.chatService.crearWebSocketUrl(idIncidente, token));

      this.chatSocket.onopen = () => {
        this.chatConectado = true;
        this.chatError = '';
      };

      this.chatSocket.onmessage = (event) => {
        try {
          const mensaje = JSON.parse(event.data) as ChatMensaje;
          const indiceTemporal = mensaje.emisor_tipo === 'tecnico'
            ? this.chatMensajes.findIndex(msg =>
                Number(msg.id || 0) < 0 &&
                msg.emisor_tipo === 'tecnico' &&
                msg.mensaje === mensaje.mensaje
              )
            : -1;

          if (indiceTemporal >= 0) {
            const mensajes = [...this.chatMensajes];
            mensajes[indiceTemporal] = mensaje;
            this.chatMensajes = mensajes;
          } else {
            this.chatMensajes = [...this.chatMensajes, mensaje];
          }
          setTimeout(() => this.scrollChatAlFinal(), 80);
        } catch {
          console.warn('Mensaje de chat no valido:', event.data);
        }
      };

      this.chatSocket.onerror = () => {
        this.chatConectado = false;
        this.chatError = 'Conexion de chat inestable. Se usara respaldo HTTP si envias mensajes.';
      };

      this.chatSocket.onclose = () => {
        this.chatConectado = false;
        if (this.chatDebeReconectar) {
          this.programarReconexionChat();
        }
      };
    } catch (error) {
      console.error('ERROR WEBSOCKET CHAT:', error);
      this.chatConectado = false;
      this.chatError = 'No se pudo abrir WebSocket. Puedes enviar por respaldo HTTP.';
      this.programarReconexionChat();
    }

    this.iniciarRefrescoChat(idIncidente, token);
  }

  enviarMensajeChat(): void {
    const texto = this.chatTexto.trim();
    const idIncidente = Number(this.incidenteActual?.id_incidente || 0);
    const token = this.getToken();

    if (!texto || !idIncidente || !token) return;

    const payload = {
      mensaje: texto,
      tipo_mensaje: 'texto' as const
    };

    if (this.chatSocket?.readyState === WebSocket.OPEN) {
      this.chatSocket.send(JSON.stringify(payload));
      this.chatMensajes = [
        ...this.chatMensajes,
        {
          id: -Date.now(),
          id_incidente: idIncidente,
          emisor_tipo: 'tecnico',
          mensaje: texto,
          tipo_mensaje: 'texto',
          leido: false,
          fecha_hora: new Date().toISOString()
        }
      ];
      this.chatTexto = '';
      setTimeout(() => this.scrollChatAlFinal(), 80);
      return;
    }

    this.enviandoChat = true;
    this.chatError = '';

    this.chatService.enviarMensajeHttp(idIncidente, token, payload).subscribe({
      next: (mensaje) => {
        this.chatMensajes = [...this.chatMensajes, mensaje];
        this.chatTexto = '';
        this.enviandoChat = false;
        setTimeout(() => this.scrollChatAlFinal(), 80);
      },
      error: (err) => {
        console.error('ERROR ENVIAR CHAT HTTP:', err);
        this.chatError = err.error?.detail || 'No se pudo enviar el mensaje.';
        this.enviandoChat = false;
      }
    });
  }

  private programarReconexionChat(): void {
    if (this.chatReconnectTimer) return;

    this.chatReconnectTimer = setTimeout(() => {
      this.chatReconnectTimer = null;
      const idIncidente = Number(this.incidenteActual?.id_incidente || 0);
      const token = this.getToken();

      if (idIncidente && token && this.chatDebeReconectar) {
        this.conectarChatSocket(idIncidente, token);
      }
    }, 3000);
  }

  private iniciarRefrescoChat(idIncidente: number, token: string): void {
    if (this.chatRefreshTimer) {
      clearInterval(this.chatRefreshTimer);
    }

    this.chatRefreshTimer = setInterval(() => {
      this.cargarHistorialChat(idIncidente, token, true);
    }, 5000);
  }

  private cerrarChatSocket(debeReconectar = false): void {
    this.chatDebeReconectar = debeReconectar;

    if (this.chatReconnectTimer) {
      clearTimeout(this.chatReconnectTimer);
      this.chatReconnectTimer = null;
    }

    if (!debeReconectar && this.chatRefreshTimer) {
      clearInterval(this.chatRefreshTimer);
      this.chatRefreshTimer = null;
    }

    if (this.chatSocket) {
      this.chatSocket.onopen = null;
      this.chatSocket.onmessage = null;
      this.chatSocket.onerror = null;
      this.chatSocket.onclose = null;
      this.chatSocket.close();
      this.chatSocket = null;
    }

    this.chatConectado = false;
  }

  private getToken(): string {
    return localStorage.getItem('token') || '';
  }

  private scrollChatAlFinal(): void {
    const contenedor = document.getElementById('chat-tecnico-lista');
    if (contenedor) {
      contenedor.scrollTop = contenedor.scrollHeight;
    }
  }

  ejecutarPaso(paso: PasoProgreso): void {
    if (!this.incidenteActual) {
      alert('No hay incidente asignado.');
      return;
    }

    const idAsignacion = Number(this.incidenteActual.id_asignacion);
    if (!idAsignacion || isNaN(idAsignacion)) {
      alert('ID de asignacion invalido.');
      return;
    }

    if (!this.puedeEjecutarPaso(paso)) return;

    if (paso.accion === 'llegada') {
      this.validarArriboCliente();
      return;
    }

    if (paso.accion === 'finalizar' && !confirm('Seguro que deseas finalizar este servicio?')) {
      return;
    }

    this.progresoLoading = paso.accion;
    this.error = '';
    this.mensajeExito = '';

    this.crearPayloadProgreso(this.observacion).then((payload) => {
      this.tecnicoService.actualizarProgreso(idAsignacion, paso.accion, payload).subscribe({
        next: (resp) => {
          this.mensajeExito = resp?.mensaje || 'Progreso actualizado correctamente.';
          this.observacion = '';
          this.incidenteActual.id_estado_asignacion = Number(resp?.id_estado_asignacion || paso.estadoObjetivo);
          this.incidenteActual.estado = this.getEstadoTexto(this.incidenteActual.id_estado_asignacion);

          if (paso.accion === 'en-camino') {
            this.iniciarTrackingUbicacion();
            this.abrirRutaSiHayCoordenadas();
          }

          if (paso.accion === 'finalizar') {
            this.detenerTrackingUbicacion();
          }

          this.progresoLoading = '';
          this.cargarIncidenteActual();
        },
        error: (err: any) => {
          console.error('ERROR ACTUALIZAR PROGRESO:', err);
          this.error = err.error?.detail || 'Error al actualizar el progreso del servicio.';
          this.progresoLoading = '';
        }
      });
    });
  }

  puedeEjecutarPaso(paso: PasoProgreso): boolean {
    const estado = Number(this.incidenteActual?.id_estado_asignacion || 0);
    return paso.estadosPermitidos.includes(estado);
  }

  pasoCompletado(paso: PasoProgreso): boolean {
    const estado = Number(this.incidenteActual?.id_estado_asignacion || 0);
    return this.getOrdenEstado(estado) >= this.getOrdenEstado(paso.estadoObjetivo);
  }

  getOrdenEstado(estado: number): number {
    const orden: Record<number, number> = {
      4: 0,
      9: 1,
      5: 2,
      10: 3,
      11: 4,
      6: 5
    };
    return orden[estado] ?? 0;
  }

  getEstadoTexto(estado: number): string {
    const estados: Record<number, string> = {
      4: 'Asignado',
      9: 'Aceptado',
      5: 'En camino',
      10: 'Llegada registrada',
      11: 'Atencion iniciada',
      6: 'Finalizado'
    };
    return estados[estado] || this.incidenteActual?.estado || 'Asignado';
  }

  getAccionTexto(accion: AccionProgresoTecnico): string {
    const textos: Record<AccionProgresoTecnico, string> = {
      aceptar: 'Aceptar',
      'en-camino': 'En camino',
      llegada: 'Llegada',
      'iniciar-atencion': 'Iniciar atencion',
      finalizar: 'Finalizar'
    };
    return textos[accion];
  }

  validarArriboCliente(): void {
    if (!this.incidenteActual) {
      alert('No hay incidente asignado.');
      return;
    }

    const idAsignacion = Number(this.incidenteActual.id_asignacion);
    if (!idAsignacion || isNaN(idAsignacion)) {
      alert('ID de asignacion invalido.');
      return;
    }

    if (Number(this.incidenteActual.id_estado_asignacion) !== 5) {
      this.error = 'Solo puedes validar arribo cuando el servicio esta en camino.';
      return;
    }

    const pin = this.pinArribo.trim();
    const qrToken = this.qrTokenArribo.trim();

    if (this.modoValidacion === 'pin' && !pin) {
      this.error = 'Ingresa el PIN que muestra el cliente.';
      return;
    }

    if (this.modoValidacion === 'qr' && !qrToken) {
      this.error = 'Ingresa o escanea el token QR que muestra el cliente.';
      return;
    }

    this.validandoArribo = true;
    this.progresoLoading = 'llegada';
    this.error = '';
    this.mensajeExito = '';

    this.crearPayloadArribo().then((payload) => {
      this.tecnicoService.validarArribo(idAsignacion, payload).subscribe({
        next: (resp) => {
          this.mensajeExito = resp?.mensaje || 'Arribo validado correctamente.';
          this.pinArribo = '';
          this.qrTokenArribo = '';
          this.incidenteActual.id_estado_asignacion = Number(resp?.id_estado_asignacion || 10);
          this.incidenteActual.estado = resp?.estado || this.getEstadoTexto(this.incidenteActual.id_estado_asignacion);

          const ubicacion = resp?.ubicacion_validada;
          if (ubicacion?.latitud && ubicacion?.longitud) {
            this.actualizarUbicacionTecnico(Number(ubicacion.latitud), Number(ubicacion.longitud));
          }

          this.validandoArribo = false;
          this.progresoLoading = '';
          this.cargarIncidenteActual();
        },
        error: (err: any) => {
          console.error('ERROR VALIDAR ARRIBO:', err);
          this.error = err.error?.detail || 'No se pudo validar el arribo.';
          this.validandoArribo = false;
          this.progresoLoading = '';
        }
      });
    });
  }

  verUbicacion(): void {
    if (!this.incidenteActual) return;

    const lat = Number(this.incidenteActual.latitud);
    const lng = Number(this.incidenteActual.longitud);

    if (!lat || !lng) {
      alert('Este incidente no tiene ubicacion valida.');
      return;
    }

    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  }

  abrirRutaSiHayCoordenadas(): void {
    if (!this.incidenteActual) return;

    const latCliente = Number(this.incidenteActual.latitud);
    const lngCliente = Number(this.incidenteActual.longitud);

    if (latCliente && lngCliente) {
      this.abrirRutaEnMapa(latCliente, lngCliente);
    }
  }

  abrirRutaEnMapa(latCliente: number, lngCliente: number): void {
    if (!navigator.geolocation) {
      const urlDestino = `https://www.google.com/maps/dir/?api=1&destination=${latCliente},${lngCliente}&travelmode=driving`;
      window.open(urlDestino, '_blank');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latTecnico = position.coords.latitude;
        const lngTecnico = position.coords.longitude;
        const urlRuta = `https://www.google.com/maps/dir/?api=1&origin=${latTecnico},${lngTecnico}&destination=${latCliente},${lngCliente}&travelmode=driving`;
        window.open(urlRuta, '_blank');
      },
      () => {
        const urlDestino = `https://www.google.com/maps/dir/?api=1&destination=${latCliente},${lngCliente}&travelmode=driving`;
        window.open(urlDestino, '_blank');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  iniciarTrackingUbicacion(): void {
    if (this.intervalUbicacion) return;
    if (!this.incidenteActual) return;

    const idAsignacion = Number(this.incidenteActual.id_asignacion);
    if (!idAsignacion || isNaN(idAsignacion)) return;

    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalizacion.');
      return;
    }

    this.enviarUbicacionActual();
    this.intervalUbicacion = setInterval(() => {
      this.enviarUbicacionActual();
    }, 5000);
  }

  enviarUbicacionActual(): void {
    if (!this.incidenteActual) return;

    const idAsignacion = Number(this.incidenteActual.id_asignacion);
    if (!idAsignacion || isNaN(idAsignacion)) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitud = position.coords.latitude;
        const longitud = position.coords.longitude;

        this.actualizarUbicacionTecnico(latitud, longitud);

        this.trackingService.enviarUbicacion({
          id_asignacion: idAsignacion,
          latitud,
          longitud
        }).subscribe({
          next: (resp) => console.log('Ubicacion enviada:', resp),
          error: (err) => console.error('Error enviando ubicacion:', err)
        });
      },
      (error) => console.error('Error obteniendo ubicacion:', error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  detenerTrackingUbicacion(): void {
    if (!this.intervalUbicacion) return;
    clearInterval(this.intervalUbicacion);
    this.intervalUbicacion = null;
  }

  private async crearPayloadProgreso(observacion: string): Promise<ProgresoTecnicoPayload> {
    const payload: ProgresoTecnicoPayload = {};
    const texto = observacion.trim();

    if (texto) {
      payload.observacion = texto;
    }

    const ubicacion = await this.obtenerUbicacionActualSilenciosa();
    if (ubicacion) {
      payload.latitud = ubicacion.latitud;
      payload.longitud = ubicacion.longitud;
    }

    return payload;
  }

  private async crearPayloadArribo(): Promise<ValidarArriboPayload> {
    const payload: ValidarArriboPayload = {};

    if (this.modoValidacion === 'pin') {
      payload.pin = this.pinArribo.trim();
    } else {
      payload.qr_token = this.qrTokenArribo.trim();
    }

    const ubicacion = await this.obtenerUbicacionActualSilenciosa();
    if (ubicacion) {
      payload.latitud = ubicacion.latitud;
      payload.longitud = ubicacion.longitud;
    }

    return payload;
  }

  private inicializarMapa(): void {
    const contenedor = document.getElementById('mapa-tecnico-servicio');
    if (!contenedor || !this.incidenteActual) return;

    this.destruirMapa();

    const latCliente = Number(this.incidenteActual.latitud);
    const lngCliente = Number(this.incidenteActual.longitud);
    const centro: L.LatLngExpression = [
      latCliente || -17.7833,
      lngCliente || -63.1821
    ];

    this.mapa = L.map('mapa-tecnico-servicio').setView(centro, 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.mapa);

    if (latCliente && lngCliente) {
      this.marcadorCliente = L.marker([latCliente, lngCliente])
        .addTo(this.mapa)
        .bindPopup('Cliente');
    }

    this.obtenerUbicacionActualSilenciosa().then((ubicacion) => {
      if (ubicacion) {
        this.actualizarUbicacionTecnico(ubicacion.latitud, ubicacion.longitud);
      }
    });

    setTimeout(() => this.mapa?.invalidateSize(), 200);
  }

  private actualizarUbicacionTecnico(latitud: number, longitud: number): void {
    if (!this.mapa) return;

    const posicionTecnico: L.LatLngExpression = [latitud, longitud];

    if (this.marcadorTecnico) {
      this.marcadorTecnico.setLatLng(posicionTecnico);
    } else {
      this.marcadorTecnico = L.marker(posicionTecnico)
        .addTo(this.mapa)
        .bindPopup('Tecnico');
    }

    const latCliente = Number(this.incidenteActual?.latitud);
    const lngCliente = Number(this.incidenteActual?.longitud);

    if (latCliente && lngCliente) {
      const puntos: L.LatLngExpression[] = [
        [latitud, longitud],
        [latCliente, lngCliente]
      ];

      if (this.lineaRuta) {
        this.lineaRuta.setLatLngs(puntos);
      } else {
        this.lineaRuta = L.polyline(puntos, {
          color: '#ff6b35',
          weight: 4,
          opacity: 0.85
        }).addTo(this.mapa);
      }

      this.mapa.fitBounds(L.latLngBounds(puntos), {
        padding: [40, 40],
        maxZoom: 15
      });
    } else {
      this.mapa.setView(posicionTecnico, 15);
    }
  }

  private destruirMapa(): void {
    if (!this.mapa) return;

    this.mapa.remove();
    this.mapa = null;
    this.marcadorCliente = null;
    this.marcadorTecnico = null;
    this.lineaRuta = null;
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

  private obtenerUbicacionActualSilenciosa(): Promise<{ latitud: number; longitud: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitud: position.coords.latitude,
            longitud: position.coords.longitude
          });
        },
        () => resolve(null),
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0
        }
      );
    });
  }
}
