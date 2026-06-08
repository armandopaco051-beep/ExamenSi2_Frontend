import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ChatMensaje, ChatService } from '../../core/services/chat.service';
import { TecnicoDashboardService } from '../../core/services/dashboardTecnico.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-chat-tecnico',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, RouterLink, NavbarComponent],
  templateUrl: './chat-tecnico.component.html',
  styleUrls: ['./chat-tecnico.component.scss']
})
export class ChatTecnicoComponent implements OnInit, OnDestroy {
  loading = true;
  chatLoading = false;
  enviando = false;
  error = '';
  chatError = '';
  mensajeTexto = '';
  chatConectado = false;
  ultimaActualizacion: Date | null = null;

  asignacionActual: any | null = null;
  mensajes: ChatMensaje[] = [];

  private chatSocket: WebSocket | null = null;
  private reconnectTimer: any = null;
  private refreshTimer: any = null;
  private debeReconectar = false;

  constructor(
    private tecnicoService: TecnicoDashboardService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.cargarAsignacionActual();
  }

  ngOnDestroy(): void {
    this.cerrarChat();
  }

  cargarAsignacionActual(): void {
    this.loading = true;
    this.error = '';

    this.tecnicoService.obtenerAsignacionActual().subscribe({
      next: (asignacion) => {
        this.asignacionActual = asignacion;
        this.loading = false;

        if (this.idIncidente) {
          this.iniciarChat();
        } else {
          this.cerrarChat();
          this.mensajes = [];
        }
      },
      error: (err) => {
        console.error('ERROR ASIGNACION CHAT:', err);
        this.error = err.error?.detail || 'No se pudo cargar el servicio actual.';
        this.loading = false;
      }
    });
  }

  iniciarChat(): void {
    const idIncidente = this.idIncidente;
    const token = this.token;

    if (!idIncidente || !token) {
      this.chatError = 'No se pudo iniciar el chat: faltan datos de sesion.';
      return;
    }

    this.cargarHistorial(false);
    this.conectarSocket(idIncidente, token);
    this.iniciarRefrescoCadaCincoSegundos();
  }

  cargarHistorial(silencioso = true): void {
    const idIncidente = this.idIncidente;
    const token = this.token;

    if (!idIncidente || !token) return;

    if (!silencioso) {
      this.chatLoading = true;
      this.chatError = '';
    }

    this.chatService.obtenerMensajes(idIncidente, token).subscribe({
      next: (mensajes) => {
        const cantidadAnterior = this.mensajes.length;
        this.mensajes = this.combinarConTemporales(mensajes || []);
        this.ultimaActualizacion = new Date();
        this.chatLoading = false;

        if (!silencioso || this.mensajes.length !== cantidadAnterior) {
          setTimeout(() => this.scrollAlFinal(), 80);
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

  enviarMensaje(): void {
    const texto = this.mensajeTexto.trim();
    const idIncidente = this.idIncidente;
    const token = this.token;

    if (!texto || !idIncidente || !token || this.enviando) return;

    const payload = {
      mensaje: texto,
      tipo_mensaje: 'texto' as const
    };

    if (this.chatSocket?.readyState === WebSocket.OPEN) {
      this.chatSocket.send(JSON.stringify(payload));
      this.agregarMensajeTemporal(texto);
      this.mensajeTexto = '';
      return;
    }

    this.enviando = true;
    this.chatError = '';

    this.chatService.enviarMensajeHttp(idIncidente, token, payload).subscribe({
      next: (mensaje) => {
        this.mensajes = this.combinarConTemporales([...this.mensajes, mensaje]);
        this.mensajeTexto = '';
        this.enviando = false;
        setTimeout(() => this.scrollAlFinal(), 80);
      },
      error: (err) => {
        console.error('ERROR ENVIAR CHAT:', err);
        this.chatError = err.error?.detail || 'No se pudo enviar el mensaje.';
        this.enviando = false;
      }
    });
  }

  refrescarManual(): void {
    this.cargarHistorial(false);
  }

  get idIncidente(): number {
    return Number(this.asignacionActual?.id_incidente || 0);
  }

  get estadoConexion(): string {
    if (this.chatConectado) return 'En tiempo real';
    if (this.refreshTimer) return 'Actualizando cada 5 segundos';
    return 'Desconectado';
  }

  private conectarSocket(idIncidente: number, token: string): void {
    this.cerrarSocket(false);
    this.debeReconectar = true;

    try {
      this.chatSocket = new WebSocket(this.chatService.crearWebSocketUrl(idIncidente, token));

      this.chatSocket.onopen = () => {
        this.chatConectado = true;
        this.chatError = '';
      };

      this.chatSocket.onmessage = (event) => {
        try {
          const mensaje = JSON.parse(event.data) as ChatMensaje;
          this.recibirMensaje(mensaje);
        } catch {
          console.warn('Mensaje de chat no valido:', event.data);
        }
      };

      this.chatSocket.onerror = () => {
        this.chatConectado = false;
        this.chatError = 'Conexion inestable. Se seguira refrescando cada 5 segundos.';
      };

      this.chatSocket.onclose = () => {
        this.chatConectado = false;
        if (this.debeReconectar) {
          this.programarReconexion();
        }
      };
    } catch (error) {
      console.error('ERROR SOCKET CHAT:', error);
      this.chatConectado = false;
      this.chatError = 'No se pudo abrir el chat en tiempo real. Se usara refresco cada 5 segundos.';
      this.programarReconexion();
    }
  }

  private recibirMensaje(mensaje: ChatMensaje): void {
    if (mensaje.id && this.mensajes.some(item => item.id === mensaje.id)) return;

    const temporalIndex = mensaje.emisor_tipo === 'tecnico'
      ? this.mensajes.findIndex(item =>
          Number(item.id || 0) < 0 &&
          item.emisor_tipo === 'tecnico' &&
          item.mensaje === mensaje.mensaje
        )
      : -1;

    if (temporalIndex >= 0) {
      const copia = [...this.mensajes];
      copia[temporalIndex] = mensaje;
      this.mensajes = this.ordenarMensajes(copia);
    } else {
      this.mensajes = this.ordenarMensajes([...this.mensajes, mensaje]);
    }

    this.ultimaActualizacion = new Date();
    setTimeout(() => this.scrollAlFinal(), 80);
  }

  private agregarMensajeTemporal(texto: string): void {
    this.mensajes = [
      ...this.mensajes,
      {
        id: -Date.now(),
        id_incidente: this.idIncidente,
        emisor_tipo: 'tecnico',
        mensaje: texto,
        tipo_mensaje: 'texto',
        leido: false,
        fecha_hora: new Date().toISOString()
      }
    ];
    this.ultimaActualizacion = new Date();
    setTimeout(() => this.scrollAlFinal(), 80);
  }

  private combinarConTemporales(mensajesServidor: ChatMensaje[]): ChatMensaje[] {
    const temporales = this.mensajes.filter(item => {
      const esTemporal = Number(item.id || 0) < 0;
      const yaConfirmado = mensajesServidor.some(m =>
        m.emisor_tipo === item.emisor_tipo &&
        m.mensaje === item.mensaje
      );

      return esTemporal && !yaConfirmado;
    });

    return this.ordenarMensajes([...mensajesServidor, ...temporales]);
  }

  private ordenarMensajes(mensajes: ChatMensaje[]): ChatMensaje[] {
    return [...mensajes].sort((a, b) => {
      const fechaA = new Date(a.fecha_hora || '').getTime() || 0;
      const fechaB = new Date(b.fecha_hora || '').getTime() || 0;
      return fechaA - fechaB;
    });
  }

  private iniciarRefrescoCadaCincoSegundos(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(() => {
      this.cargarHistorial(true);
    }, 5000);
  }

  private programarReconexion(): void {
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      const idIncidente = this.idIncidente;
      const token = this.token;

      if (idIncidente && token && this.debeReconectar) {
        this.conectarSocket(idIncidente, token);
      }
    }, 3000);
  }

  private cerrarChat(): void {
    this.cerrarSocket(false);

    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private cerrarSocket(debeReconectar = false): void {
    this.debeReconectar = debeReconectar;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
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

  private scrollAlFinal(): void {
    const contenedor = document.getElementById('chat-tecnico-vista-lista');
    if (contenedor) {
      contenedor.scrollTop = contenedor.scrollHeight;
    }
  }

  private get token(): string {
    return localStorage.getItem('token') || '';
  }
}
