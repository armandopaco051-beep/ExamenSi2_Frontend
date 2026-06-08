import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { AsignacionService } from '../../core/services/asignacion.service';
import { TecnicoService } from '../../core/services/tecnico.service';
import { EvidenciaService } from '../../core/services/evicencia.service';
import { ChatMensaje, ChatService } from '../../core/services/chat.service';
import { ComprobantePago, PagoService, ResumenCobro } from '../../core/services/pago.service';
import { environment } from '../../../enviroments/enviroments';

@Component({
  selector: 'app-incidentes-taller',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, NavbarComponent],
  templateUrl: './incidentes-taller.component.html',
  styleUrls: ['./incidentes-taller.component.scss']
})
export class IncidentesTallerComponent implements OnInit {
  idTaller = 0;
  loading = true;
  error = '';

  // ✅ CAMBIO: lista de asignaciones/incidentes del taller
  incidentes: any[] = [];

  // ✅ CAMBIO: modal detalle
  mostrarDetalle = false;
  incidenteSeleccionado: any = null;

  // ✅ CAMBIO: modal asignar técnico
  mostrarAsignarTecnico = false;
  asignacionSeleccionada: any = null;
  tecnicosDisponibles: any[] = [];
  tecnicoSeleccionado = '';
  evidencias :any[] =[]; 
  loadingEvidencias = false ; 
  errorEvidencia = ''; 
  chatMensajes: ChatMensaje[] = [];
  loadingChat = false;
  errorChat = '';
  resumenCobro: ResumenCobro | null = null;
  comprobantePago: ComprobantePago | null = null;
  loadingPagos = false;
  errorPagos = '';
  private incidentePendienteDetalle = 0;


  categorias: Record<number, string> = {
    1: 'Batería descargada',
    2: 'Llanta pinchada',
    3: 'Falla de motor',
    4: 'Sobrecalentamiento',
    5: 'Accidente leve',
    6: 'Falta de combustible',
    7: 'Cerrajería vehicular',
    8: 'No arranca',
    9: 'Falla eléctrica',
    10: 'Otro problema'
  };

  prioridades: Record<number, string> = {
    1: 'Baja',
    2: 'Media',
    3: 'Alta',
    4: 'Crítica'
  };

  constructor(
    private asignacionService: AsignacionService,
    private tecnicoService: TecnicoService,
    private evidenciaService : EvidenciaService,
    private chatService: ChatService,
    private pagoService: PagoService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const idTallerStorage = localStorage.getItem('id_taller');

    console.log('ID TALLER STORAGE:', idTallerStorage);

    if (!idTallerStorage || idTallerStorage === 'null' || idTallerStorage === 'undefined') {
      this.loading = false;
      this.error = 'No se encontró el taller del usuario logueado';
      return;
    }

    this.idTaller = Number(idTallerStorage);

    if (!this.idTaller || isNaN(this.idTaller)) {
      this.loading = false;
      this.error = 'El id del taller no es válido';
      return;
    }

    this.route.queryParamMap.subscribe(params => {
      this.incidentePendienteDetalle = Number(params.get('incidente') || 0);
      this.abrirDetallePendiente();
    });

    this.cargarIncidentes();
    this.cargarTecnicosDisponibles();
  }

  // ✅ CAMBIO: carga las solicitudes que llegaron a este taller
  cargarIncidentes(): void {
    this.loading = true;
    this.error = '';

    console.log('ID TALLER USADO:', this.idTaller);

    this.asignacionService.listarPorTaller(this.idTaller).subscribe({
      next: (data: any[]) => {
        console.log('INCIDENTES DEL TALLER:', data);
        this.incidentes = data;
        this.loading = false;
        this.abrirDetallePendiente();
      },
      error: (err: any) => {
        console.error('ERROR INCIDENTES:', err);
        this.error = err.status === 403
          ? 'No tienes permiso para acceder a la información de este taller.'
          : err.error?.detail || 'No se pudieron cargar los incidentes.';
        this.loading = false;
      }
    });
  }

  // ✅ CAMBIO: obtiene técnicos disponibles del taller
  cargarTecnicosDisponibles(): void {
    this.tecnicoService.listarMisTecnicos().subscribe({
      next: (data: any[]) => {
        this.tecnicosDisponibles = (data || []).filter(t => t.disponibilidad === true);
        console.log('TÉCNICOS DISPONIBLES:', this.tecnicosDisponibles);
      },
      error: (err: any) => {
        console.error('ERROR TÉCNICOS:', err);
        if (err.status === 403) {
          this.error = 'No tienes permiso para acceder a la información de este taller.';
        }
      }
    });
  }

  // ✅ CAMBIO: aceptar solicitud. Luego abre directamente asignación de técnico.
  aceptarSolicitud(item: any): void {
    const idAsignacion = item.id;

    if (!idAsignacion) {
      alert('No se encontró la asignación');
      return;
    }

    this.asignacionService.aceptarAsignacion(idAsignacion).subscribe({
      next: () => {
        item.id_estado_asignacion = 2; // ✅ CAMBIO: localmente queda aceptada
        this.abrirAsignarTecnico(item); // ✅ CAMBIO: abrir selección de técnico
        this.cargarIncidentes(); 
      },
      error: (err: any) => {
        console.error(err);
        alert(err.error?.detail || 'Error al aceptar la solicitud');
      }
    });
  }

  // ✅ CAMBIO: rechazar solicitud. El backend buscará el siguiente taller.
  rechazarSolicitud(item: any): void {
    const idAsignacion = item.id;

    if (!idAsignacion) {
      alert('No se encontró la asignación');
      return;
    }

    const observacion = prompt('Motivo del rechazo:');

    if (!observacion) return;

    this.asignacionService.rechazarAsignacion(idAsignacion, observacion).subscribe({
      next: (resp: any) => {
        alert(resp.mensaje || 'Solicitud rechazada');
        this.cargarIncidentes(); // ✅ CAMBIO: desaparece de este taller si fue rechazada
      },
      error: (err: any) => {
        console.error(err);
        alert(err.error?.detail || 'Error al rechazar la solicitud');
      }
    });
  }

  // ✅ CAMBIO: abrir modal de asignar técnico
  abrirAsignarTecnico(item: any): void {
    this.asignacionSeleccionada = item;
    this.tecnicoSeleccionado = '';
    this.mostrarAsignarTecnico = true;
    this.cargarTecnicosDisponibles();
  }

  // ✅ CAMBIO: cerrar modal de asignar técnico
  cerrarAsignarTecnico(): void {
    this.asignacionSeleccionada = null;
    this.tecnicoSeleccionado = '';
    this.mostrarAsignarTecnico = false;
  }

  // ✅ CAMBIO: confirmar técnico seleccionado
  confirmarAsignacionTecnico(): void {
      if (!this.asignacionSeleccionada) {
            alert('No se encontró la asignación');
            return;
        }

        if (!this.tecnicoSeleccionado) {
            alert('Selecciona un técnico disponible');
            return;
        }

        // ✅ CAMBIO: aseguramos que el id sea número
        const idAsignacion = Number(this.asignacionSeleccionada.id);

        // ✅ CAMBIO: aseguramos que el código del técnico sea texto
        const codigoTecnico = String(this.tecnicoSeleccionado).trim();

        console.log('ASIGNACIÓN SELECCIONADA:', this.asignacionSeleccionada);
        console.log('ID ASIGNACIÓN:', idAsignacion);
        console.log('CÓDIGO TÉCNICO:', codigoTecnico);

        // ✅ CAMBIO: validación extra para evitar enviar undefined o NaN
        if (!idAsignacion || isNaN(idAsignacion)) {
            alert('El ID de asignación no es válido');
            return;
        }

        if (!codigoTecnico) {
            alert('El código del técnico no es válido');
            return;
        }

        this.asignacionService.asignarTecnico(idAsignacion, codigoTecnico).subscribe({
            next: (resp: any) => {
            console.log('RESPUESTA ASIGNAR TÉCNICO:', resp);
            alert('Técnico asignado correctamente');
            this.cerrarAsignarTecnico();
            this.cargarIncidentes();
            },
            error: (err: any) => {
            //console.error('ERROR ASIGNAR TÉCNICO:', err);
            alert(err.error?.detail || 'Error al asignar técnico');
            }
        });
        }

  // ✅ CAMBIO: abrir detalle
  verDetalle(item: any): void {
    this.incidenteSeleccionado = item;
    this.mostrarDetalle = true;
    this.evidencias =[]; 
    this.errorEvidencia = ''; 
    const idIncidente = Number(item.id_incidente || item.incidente?.codigo || item.incidente?.id || item.codigo || 0); 
    if (!idIncidente || isNaN(idIncidente)) {
      alert('El ID del incidente no es válido');
      return;
    }
    this.cargarEvidencias(idIncidente); 
    this.cargarChatIncidente(idIncidente);
    this.cargarPagosIncidente(idIncidente);
  }

  private abrirDetallePendiente(): void {
    if (!this.incidentePendienteDetalle || this.mostrarDetalle || this.incidentes.length === 0) return;

    const incidente = this.incidentes.find(item => {
      const id = Number(item.id_incidente || item.incidente?.codigo || item.incidente?.id || 0);
      return id === this.incidentePendienteDetalle;
    });

    if (!incidente) return;

    this.incidentePendienteDetalle = 0;
    this.verDetalle(incidente);
  }

  cargarChatIncidente(idIncidente: number): void {
    const token = localStorage.getItem('token') || '';

    if (!token) {
      this.errorChat = 'No se encontro token para cargar el chat.';
      return;
    }

    this.loadingChat = true;
    this.errorChat = '';
    this.chatMensajes = [];

    this.chatService.obtenerMensajes(idIncidente, token).subscribe({
      next: (mensajes) => {
        this.chatMensajes = mensajes || [];
        this.loadingChat = false;
      },
      error: (err) => {
        console.error('ERROR CHAT INCIDENTE:', err);
        this.errorChat = err.status === 403
          ? 'No tienes permiso para acceder a la información de este taller.'
          : err.error?.detail || 'No se pudo cargar el historial del chat.';
        this.loadingChat = false;
      }
    });
  }

  cargarPagosIncidente(idIncidente: number): void {
    const token = localStorage.getItem('token') || '';

    if (!token) {
      this.errorPagos = 'No se encontro token para cargar pagos.';
      return;
    }

    this.loadingPagos = true;
    this.errorPagos = '';
    this.resumenCobro = null;
    this.comprobantePago = null;

    this.pagoService.obtenerResumen(idIncidente, token).subscribe({
      next: (resumen) => {
        this.resumenCobro = resumen;
        this.loadingPagos = false;
        this.cargarComprobanteIncidente(idIncidente, token);
      },
      error: (err) => {
        console.error('ERROR RESUMEN PAGO:', err);
        this.errorPagos = err.status === 403
          ? 'No tienes permiso para acceder a la información de este taller.'
          : err.error?.detail || 'No se pudo cargar el resumen del cobro.';
        this.loadingPagos = false;
      }
    });
  }

  cargarComprobanteIncidente(idIncidente: number, token: string): void {
    this.pagoService.obtenerComprobante(idIncidente, token).subscribe({
      next: (comprobante) => {
        this.comprobantePago = comprobante;
      },
      error: () => {
        this.comprobantePago = null;
      }
    });
  }

  cargarEvidencias(idIncidente : number): void{
    this.loadingEvidencias = true;
    this.errorEvidencia = '';

    this.evidenciaService.listarPorIncidente(idIncidente).subscribe({
    next: (data: any[]) => {
      console.log('EVIDENCIAS DEL INCIDENTE:', data);
      this.evidencias = data || [];
      this.loadingEvidencias = false;
    },
    error: (err: any) => {
      console.error('ERROR CARGANDO EVIDENCIAS:', err);
      this.errorEvidencia = err.error?.detail || 'No se pudieron cargar las evidencias.';
      this.loadingEvidencias = false;
    }
  });
  }
  // ✅ CAMBIO: cerrar detalle
  cerrarDetalle(): void {
    this.incidenteSeleccionado = null;
    this.mostrarDetalle = false;

    this.evidencias = [];
    this.errorEvidencia = '';
    this.loadingEvidencias = false;
    this.chatMensajes = [];
    this.errorChat = '';
    this.loadingChat = false;
    this.resumenCobro = null;
    this.comprobantePago = null;
    this.errorPagos = '';
    this.loadingPagos = false;
  }

  // ✅ CAMBIO: ubicación solo desde el detalle
  verUbicacion(item: any): void {
    const lat = this.getLatitud(item);
    const lng = this.getLongitud(item);

    if (!lat || !lng) {
      alert('Este incidente no tiene ubicación válida.');
      return;
    }

    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  }

  getDescripcion(item: any): string {
    return String(
      item.incidente?.descripcion ||
      item.descripcion ||
      'Sin descripción'
    );
  }

  getCategoria(item: any): string {
    const idCategoria = Number(
      item.incidente?.id_categoria ||
      item.incidente?.id_categoria_problema ||
      item.id_categoria ||
      10
    );

    return this.categorias[idCategoria] || 'Otro problema';
  }

  getPrioridad(item: any): string {
    const idPrioridad = Number(
      item.incidente?.id_prioridad ||
      item.id_prioridad ||
      2
    );

    return this.prioridades[idPrioridad] || 'Media';
  }

  getClasePrioridad(item: any): string {
    const idPrioridad = Number(
      item.incidente?.id_prioridad ||
      item.id_prioridad ||
      2
    );

    if (idPrioridad === 4) return 'prioridad-alta';
    if (idPrioridad === 3) return 'prioridad-alta';
    if (idPrioridad === 2) return 'prioridad-media';
    return 'prioridad-baja';
  }

  getEstadoAsignacion(item: any): string {
    const estado = Number(item.id_estado_asignacion);

    if (estado === 1) return 'Pendiente';
    if (estado === 2) return 'Aceptada';
    if (estado === 3) return 'Rechazada';
    if (estado === 4) return 'Asignada a técnico';
    if (estado === 5) return 'En camino';
    if (estado === 6) return 'Finalizada';
    if (estado === 7) return 'Cancelada';
    if (estado === 8) return 'Sin taller disponible';

    return 'Pendiente';
  }

  getFecha(item: any): string {
    return String(
      item.incidente?.fecha_reporte ||
      item.fecha_asignacion ||
      ''
    );
  }

  getLatitud(item: any): number {
    return Number(item.incidente?.latitud || item.latitud || 0);
  }

  getLongitud(item: any): number {
    return Number(item.incidente?.longitud || item.longitud || 0);
  }

  // ✅ CAMBIO: datos del cliente desde backend
  getNombreSolicitante(item: any): string {
    const usuario = item.incidente?.usuario || item.usuario || item.cliente || {};
    const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();

    return nombreCompleto || 'No enviado por backend';
  }

  getTelefonoSolicitante(item: any): string {
    const usuario = item.incidente?.usuario || item.usuario || item.cliente || {};
    return usuario.telefono || 'No enviado por backend';
  }

  getCorreoSolicitante(item: any): string {
    const usuario = item.incidente?.usuario || item.usuario || item.cliente || {};
    return usuario.email || 'No enviado por backend';
  }
  getUrlArchivo(evidencia: any): string {
    const archivo = this.getCampoArchivo(evidencia);
    if (!archivo) return '';

    return this.construirUrlArchivo(archivo);
  }

  getImagenesEvidencia(evidencia: any): string[] {
    const esTipoImagen = Number(evidencia?.id_tipo_evidencia) === 1;
    const imagenes = this.getCamposArchivo(evidencia)
      .filter(archivo => esTipoImagen || this.esRutaImagen(archivo) || this.getTipoEvidencia(evidencia).includes('image') || this.getTipoEvidencia(evidencia).includes('imagen'))
      .map(archivo => this.construirUrlArchivo(archivo))
      .filter(Boolean);

    return Array.from(new Set(imagenes));
  }

  private construirUrlArchivo(archivo: string): string {
    let ruta = String(archivo || '').replaceAll('\\', '/').trim();
    if (!ruta) return '';

    if (ruta.startsWith('http') || ruta.startsWith('data:') || ruta.startsWith('blob:')) {
      return ruta;
    }

    const uploadsIndex = ruta.toLowerCase().indexOf('uploads/');
    const staticIndex = ruta.toLowerCase().indexOf('static/');
    const mediaIndex = ruta.toLowerCase().indexOf('media/');

    if (uploadsIndex >= 0) ruta = ruta.substring(uploadsIndex);
    else if (staticIndex >= 0) ruta = ruta.substring(staticIndex);
    else if (mediaIndex >= 0) ruta = ruta.substring(mediaIndex);

    ruta = ruta.replace(/^\/+/, '');

    return `${environment.apiUrl}/${ruta}`;
  }

  esImagen(evidencia: any): boolean {
    const tipo = this.getTipoEvidencia(evidencia);
    const url = this.getUrlArchivo(evidencia).toLowerCase();

    return this.getImagenesEvidencia(evidencia).length > 0 ||
      Number(evidencia?.id_tipo_evidencia) === 1 ||
      tipo.includes('imagen') ||
      tipo.includes('image') ||
      this.esRutaImagen(url);
  }

  esAudio(evidencia: any): boolean {
    const tipo = this.getTipoEvidencia(evidencia);
    const url = this.getUrlArchivo(evidencia).toLowerCase();

    return Number(evidencia?.id_tipo_evidencia) === 2 ||
      tipo.includes('audio') ||
      tipo.includes('voz') ||
      /\.(mp3|wav|ogg|m4a|aac|webm)(\?|#|$)/.test(url);
  }

  esVideo(evidencia: any): boolean {
    const tipo = this.getTipoEvidencia(evidencia);
    const url = this.getUrlArchivo(evidencia).toLowerCase();

    return Number(evidencia?.id_tipo_evidencia) === 4 ||
      tipo.includes('video') ||
      /\.(mp4|webm|mov|avi|mkv)(\?|#|$)/.test(url);
  }

  esTexto(evidencia: any): boolean {
    const tipo = this.getTipoEvidencia(evidencia);
    const tienePreview = this.getImagenesEvidencia(evidencia).length > 0 || this.esAudio(evidencia) || this.esVideo(evidencia);
    if (tienePreview) return false;

    return !this.getUrlArchivo(evidencia) ||
      Number(evidencia?.id_tipo_evidencia) === 3 ||
      tipo.includes('texto') ||
      tipo.includes('text');
  }

  esArchivo(evidencia: any): boolean {
    return Boolean(this.getUrlArchivo(evidencia)) &&
      !this.esImagen(evidencia) &&
      !this.esAudio(evidencia) &&
      !this.esVideo(evidencia);
  }

  getTextoEvidencia(evidencia: any): string {
    return evidencia?.transcripcion ||
      evidencia?.descripcion ||
      evidencia?.mensaje ||
      evidencia?.texto ||
      evidencia?.observacion ||
      '';
  }

  getNombreArchivo(evidencia: any): string {
    const archivo = this.getCampoArchivo(evidencia);
    if (!archivo) return 'Archivo enviado';

    const partes = String(archivo).replaceAll('\\', '/').split('/');
    return partes[partes.length - 1] || 'Archivo enviado';
  }

  private getCampoArchivo(evidencia: any): string {
    return this.getCamposArchivo(evidencia)[0] || '';
  }

  private getCamposArchivo(valor: any, profundidad = 0): string[] {
    if (!valor || profundidad > 3) return [];
    if (typeof valor === 'string') return [valor];
    if (typeof valor !== 'object') return [];

    const campos = [
      'url_archivo',
      'url',
      'archivo_url',
      'urlArchivo',
      'archivo',
      'ruta_archivo',
      'path',
      'file',
      'file_url',
      'media_url',
      'multimedia_url',
      'foto',
      'foto_url',
      'fotografia',
      'fotografia_url',
      'imagen',
      'imagen_url',
      'image',
      'image_url',
      'ruta_foto',
      'ruta_imagen'
    ];

    const urls = campos
      .map(campo => valor?.[campo])
      .flatMap(item => this.getCamposArchivo(item, profundidad + 1));

    const colecciones = [
      valor?.imagenes,
      valor?.images,
      valor?.fotos,
      valor?.fotografias,
      valor?.archivos,
      valor?.files,
      valor?.adjuntos,
      valor?.multimedia,
      valor?.evidencias
    ].filter(Array.isArray);

    const urlsColecciones = colecciones.flatMap(lista =>
      lista.flatMap((item: any) => this.getCamposArchivo(item, profundidad + 1))
    );

    return [...urls, ...urlsColecciones].filter(Boolean);
  }

  private getTipoEvidencia(evidencia: any): string {
    return String(
      evidencia?.tipo ||
      evidencia?.tipo_evidencia ||
      evidencia?.nombre_tipo ||
      evidencia?.mime_type ||
      evidencia?.content_type ||
      ''
    ).toLowerCase();
  }

  private esRutaImagen(ruta: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|#|$)/i.test(String(ruta || ''));
  }

}
