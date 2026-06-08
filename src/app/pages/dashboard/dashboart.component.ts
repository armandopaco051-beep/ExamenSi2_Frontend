import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { NavbarComponent } from '../../shared/navbar/navbar.component';
import {
  DashboardAdminResponse,
  DashboardActividad,
  DashboardTendencia,
  DashboardTipoEmergencia
} from '../../models/dashboard.model';
import { DashboardService } from '../../core/services/dashboard.service';
import { SolicitudService } from '../../core/services/solicitud.service';
import { AuthService } from '../../core/services/auth.service';
import { SuscripcionService } from '../../core/services/suscripcion.service';
import { TenantSuscripcion } from '../../models/suscripcion.model';

declare const Chart: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent, DatePipe, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  usuario: any;
  stats: any = {};
  ultimos: any[] = [];
  solicitudes: any[] = [];
  pendientesSol = 0;
  loading = true;
  suscripcionesLoading = true;
  suscripcionesError = '';
  tenants: TenantSuscripcion[] = [];

  actividadReciente: DashboardActividad[] = [];
  tendenciaSemanal: DashboardTendencia[] = [];
  tipoEmergencia: DashboardTipoEmergencia[] = [];

  mostrarModalSol = false;
  solSel: any = null;
  obsResp = '';
  loadingResp = false;
  err = '';

  private chartEstados: any = null;
  private chartCategorias: any = null;
  private chartTipoEmergencia: any = null;
  private chartTendencia: any = null;

  cats: Record<number, string> = {
    1: '🔋 Batería',
    2: '🛞 Llanta',
    3: '⚙️ Motor',
    4: '🚗 Choque',
    5: '❓ Otros'
  };

  estados: Record<number, string> = {
    1: 'Pendiente',
    2: 'En proceso',
    3: 'Atendido'
  };

  estadoBadge: Record<number, string> = {
    1: 'badge-yellow',
    2: 'badge-blue',
    3: 'badge-green'
  };

  constructor(
    private dashSvc: DashboardService,
    private solSvc: SolicitudService,
    private auth: AuthService,
    private suscripcionService: SuscripcionService
  ) {}

  ngOnInit(): void {
    this.usuario = this.auth.getUsuarioStorage();
    this.cargarDashboard();
    this.cargarSolicitudes();
    this.cargarPendientesSolicitudes();
    this.cargarSuscripciones();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.renderGraficos();
    }, 500);
  }

  ngOnDestroy(): void {
    this.destruirGraficos();
  }

  cargarDashboard(): void {
    this.loading = true;

    this.dashSvc.getAdmin().subscribe({
      next: (d: any) => {
        this.stats = d?.stats || {};
        this.ultimos = d?.ultimos_incidentes || [];
        this.actividadReciente = d?.actividad_reciente || [];
        this.tendenciaSemanal = d?.tendencia_semanal || [];
        this.tipoEmergencia = d?.tipo_emergencia || [];
        this.loading = false;

        setTimeout(() => {
          this.renderGraficos();
        }, 150);
      },
      error: (err: any) => {
        console.error('Error dashboard:', err);
        this.loading = false;
      }
    });
  }

  cargarSolicitudes(): void {
    this.loading = true; 
    this.solSvc.listar('pendiente').subscribe({
      next: (data) => {
        this.solicitudes = data || [];
        this.pendientesSol = this.solicitudes.length;
        this.loading = false; 
      },
      error: (err) => {
        console.error('Error solicitudes:', err);
        this.loading = false; 
      }
    });
  }
  cargarPendientesSolicitudes() :void {
    this.solSvc.contarPendientes().subscribe({
      next: (data) =>{
        this.pendientesSol = data.pendientes || 0; 
      },
      error : (err) => {
        console.error(err)
      }
    })
  }

  cargarSuscripciones(): void {
    this.suscripcionesLoading = true;
    this.suscripcionesError = '';

    this.suscripcionService.listarTenants().subscribe({
      next: tenants => {
        this.tenants = tenants || [];
        this.suscripcionesLoading = false;
      },
      error: err => {
        console.error('Error suscripciones dashboard:', err);
        this.suscripcionesError = err.error?.detail || 'No se pudo cargar el resumen de suscripciones.';
        this.suscripcionesLoading = false;
      }
    });
  }

  get totalSuscripcionesActivas(): number {
    return this.tenants.filter(item => this.getEstadoSuscripcion(item) === 'ACTIVA').length;
  }

  get totalSuscripcionesSuspendidas(): number {
    return this.tenants.filter(item => this.getEstadoSuscripcion(item) === 'SUSPENDIDA').length;
  }

  get totalSuscripcionesVencidas(): number {
    return this.tenants.filter(item =>
      this.getEstadoSuscripcion(item) === 'VENCIDA' || this.getEstadoSuscripcion(item) === 'CANCELADA'
    ).length;
  }

  diasSuscripcion(fecha: string): number {
    if (!fecha) return 0;
    return Math.max(Math.ceil((new Date(`${fecha}T23:59:59`).getTime() - Date.now()) / 86400000), 0);
  }

  claseSuscripcion(estado: string): string {
    if (estado === 'ACTIVA') return 'subscription-active';
    if (estado === 'SUSPENDIDA') return 'subscription-suspended';
    return 'subscription-expired';
  }

  getEstadoSuscripcion(tenant: TenantSuscripcion): string {
    return String(tenant.suscripcion?.estado || tenant.estado_suscripcion || 'ACTIVA').toUpperCase();
  }

  getFechaVencimientoSuscripcion(tenant: TenantSuscripcion): string {
    return tenant.suscripcion?.fecha_vencimiento || tenant.fecha_vencimiento || '';
  }

  getDominioTenant(tenant: TenantSuscripcion): string {
    const dominio = tenant.dominio;
    if (!dominio) return 'Sin dominio registrado';
    return typeof dominio === 'string' ? dominio : dominio.dominio || 'Sin dominio registrado';
  }
  aceptarsolicitud(s: any): void {
    this.solSel =s; 
    this.responder(true); 
  }
  verSolicitud(s: any): void {
    this.solSel =s; 
    const observacion = prompt('Escribe la opcion para rechazar la solicitud:') || '';
    this.responder(false, observacion); 
  }
  responder(aceptada :boolean , observacion :string = '' ): void{
    if (!this.solSel) return;
    this.solSvc.responder(this.solSel.codigo_usuario, aceptada, observacion).subscribe({
      next: () => {
        this.solSel=null; 
        this.cargarSolicitudes(); 
        this.cargarPendientesSolicitudes(); 

      }, 
      error: (err) => {
        console.error(err);
        this.err = err.error.detail || 'Error al responder esta solicitud'
      }
    })

  }

  scrollToSol(): void {
    const elemento = document.getElementById('solicitudes-section');
    if (elemento) {
      elemento.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  renderGraficos(): void {
    this.destruirGraficos();
    this.graficoEstados();
    this.graficoTendencia();
    this.graficoTipoEmergencia();
  }

  destruirGraficos(): void {
    if (this.chartEstados) {
      this.chartEstados.destroy();
      this.chartEstados = null;
    }
    if (this.chartCategorias) {
      this.chartCategorias.destroy();
      this.chartCategorias = null;
    }
    if (this.chartTipoEmergencia) {
      this.chartTipoEmergencia.destroy();
      this.chartTipoEmergencia = null;
    }
    if (this.chartTendencia) {
      this.chartTendencia.destroy();
      this.chartTendencia = null;
    }
  }

  private graficoEstados(): void {
    const el = document.getElementById('g-estados') as HTMLCanvasElement;
    if (!el || typeof Chart === 'undefined') return;

    this.chartEstados = new Chart(el, {
      type: 'doughnut',
      data: {
        labels: ['Pendientes', 'En proceso', 'Atendidos'],
        datasets: [{
          data: [
            this.stats.pendientes || 0,
            this.stats.en_proceso || 0,
            this.stats.atendidos || 0
          ],
          backgroundColor: ['#ffb21d', '#2f9cff', '#4ecb71'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#a7b4c8',
              font: { size: 11 }
            }
          }
        }
      }
    });
  }

  private graficoTendencia(): void {
    const el = document.getElementById('g-tendencia') as HTMLCanvasElement;
    if (!el || typeof Chart === 'undefined') return;

    this.chartTendencia = new Chart(el, {
      type: 'bar',
      data: {
        labels: this.tendenciaSemanal.map(x => x.dia),
        datasets: [{
          data: this.tendenciaSemanal.map(x => x.total),
          backgroundColor: '#ff6b35',
          borderRadius: 10,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            ticks: {
              color: '#94a0b8',
              font: { size: 11 }
            },
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#94a0b8',
              font: { size: 11 },
              precision: 0
            },
            grid: {
              color: 'rgba(255,255,255,.06)'
            }
          }
        }
      }
    });
  }

  private graficoTipoEmergencia(): void {
    const el = document.getElementById('g-tipos') as HTMLCanvasElement;
    if (!el || typeof Chart === 'undefined') return;

    this.chartTipoEmergencia = new Chart(el, {
      type: 'doughnut',
      data: {
        labels: this.tipoEmergencia.map(x => x.categoria),
        datasets: [{
          data: this.tipoEmergencia.map(x => x.total),
          backgroundColor: ['#ff7648', '#ffb21d', '#2f9cff', '#ff3450', '#a04dd8'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#a7b4c8',
              font: { size: 11 }
            }
          }
        }
      }
    });
  }

  getActividadClase(item: DashboardActividad): string {
    const texto = `${item.modulo} ${item.accion}`.toLowerCase();

    if (texto.includes('rechazar') || texto.includes('error')) {
      return 'red';
    }

    if (texto.includes('aceptar') || texto.includes('aprobar')) {
      return 'warning';
    }

    return 'orange';
  }

  

  

  getPrioridadNombre(id: number): string {
    if (id === 1) return 'Alta';
    if (id === 2) return 'Media';
    return 'Baja';
  }

  getPrioridadClase(id: number): string {
    if (id === 1) return 'badge-red';
    if (id === 2) return 'badge-yellow';
    return 'badge-green';
  }

  getTallerNombreSolicitud(s: any): string {
    return s.nombre_taller || 'sin taller'
  }

  getTallerTelefonoSolicitud(s: any): string {
    return s?.taller?.telefono || s?.telefono_taller || '—';
  }

  getTallerDireccionSolicitud(s: any): string {
    return s?.taller?.direccion || s?.direccion_taller || '—';
  }

  getTallerHorarioSolicitud(s: any): string {
    const hi = s?.taller?.horario_inicio || s?.horario_inicio || '—';
    const hf = s?.taller?.horario_fin || s?.horario_fin || '—';
    return `${hi} - ${hf}`;
  }
}
