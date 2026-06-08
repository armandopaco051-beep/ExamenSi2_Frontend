import { Component, OnInit } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { forkJoin } from "rxjs";

import { NavbarComponent } from "../../shared/navbar/navbar.component";
import { AuthService } from "../../core/services/auth.service";
import { TecnicoDashboardResumen,HistorialTecnicoItem,IncidenteTecnicoActual} from "../../models/dashboard_tecnicos.model";
import { TecnicoDashboardService } from "../../core/services/dashboardTecnico.service";

@Component({
  selector : 'app-tecnico-dashboard',
  standalone: true,
  imports:[CommonModule, DatePipe, RouterLink, NavbarComponent],
  templateUrl: './dashboard-tecnico.component.html',
  styleUrls: ['./dashboard-tecnico.component.scss']
})
export class TecnicoDashboardComponent implements OnInit {
  loading = true;
  error = '';

  tecnico = {
    nombre: '',
    codigo: '',
    estado: 'Disponible'
  };

  resumen: TecnicoDashboardResumen = {
    activos: 0,
    finalizados: 0,
    hoy: 0,
    calificacion: 0
  };

  incidenteActual: IncidenteTecnicoActual | null = null;
  historialPreview: HistorialTecnicoItem[] = [];

  constructor(
    private authService: AuthService,
    private tecnicoDashboardService: TecnicoDashboardService
  ) {}

  ngOnInit(): void {
    this.cargarDatosTecnicoLocal();
    this.cargarDashboardReal();
  }

  cargarDatosTecnicoLocal(): void {
    const usuario = this.authService.getUsuarioActual();

    this.tecnico = {
      nombre: usuario?.nombre || 'Técnico',
      codigo: usuario?.codigo || '',
      estado: 'Disponible'
    };
  }
  cargarDashboardReal(): void {
  this.loading = true;
  this.error = '';

  forkJoin({
    actual: this.tecnicoDashboardService.obtenerAsignacionActual(),
    historial: this.tecnicoDashboardService.obtenerHistorial()
  }).subscribe({
    next: ({ actual, historial }) => {
      this.incidenteActual = actual;
      this.historialPreview = (historial || []).slice(0, 3);

      const historialCompleto = historial || [];

      const activos = historialCompleto.filter((h: any) =>
        h.id_estado_asignacion === 4 || h.id_estado_asignacion === 5
      ).length;

      const finalizados = historialCompleto.filter((h: any) =>
        h.id_estado_asignacion === 6 || h.estado === 'Finalizada'
      ).length;

      const hoy = historialCompleto.filter((h: any) => {
        if (!h.fecha) return false;

        const fechaItem = new Date(h.fecha).toDateString();
        const fechaHoy = new Date().toDateString();

        return fechaItem === fechaHoy;
      }).length;

      this.resumen = {
        activos: activos,
        finalizados: finalizados,
        hoy: hoy,
        calificacion: 5.0
      };

      this.tecnico.estado = this.incidenteActual ? 'Ocupado' : 'Disponible';

      this.loading = false;
    },
    error: (err: any) => {
      console.error('ERROR DASHBOARD TÉCNICO:', err);
      console.log('STATUS:', err.status);
      console.log('URL:', err.url);
      console.log('ERROR BODY:', err.error);

      this.error = err.error?.detail || `No se pudo cargar el dashboard del técnico. Error ${err.status}`;
      this.loading = false;
    }
  });
}
  
  verUbicacionCliente(): void {
    if (!this.incidenteActual) return;

    window.open(
      `https://www.google.com/maps?q=${this.incidenteActual.latitud},${this.incidenteActual.longitud}`,
      '_blank'
    );
  }

  iniciarRuta(): void {
    if (!this.incidenteActual) {
      alert('No hay incidente asignado.');
      return;
    }

    this.tecnicoDashboardService.iniciarRuta(this.incidenteActual.id_asignacion).subscribe({
      next: () => {
        alert('Ruta iniciada correctamente.');
        this.cargarDashboardReal();
      },
      error: (err: any) => {
        console.error(err);
        alert(err.error?.detail || 'Error al iniciar ruta.');
      }
    });
  }

  finalizarServicio(): void {
    if (!this.incidenteActual) {
      alert('No hay incidente asignado.');
      return;
    }

    const confirmar = confirm('¿Seguro que deseas finalizar este servicio?');

    if (!confirmar) return;

    this.tecnicoDashboardService.finalizarServicio(this.incidenteActual.id_asignacion).subscribe({
      next: () => {
        alert('Servicio finalizado correctamente.');
        this.cargarDashboardReal();
      },
      error: (err: any) => {
        console.error(err);
        alert(err.error?.detail || 'Error al finalizar servicio.');
      }
    });
  }
}