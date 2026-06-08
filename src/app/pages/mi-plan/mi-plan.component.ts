import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { SuscripcionService } from '../../core/services/suscripcion.service';
import { CuotaValores, CuotasTenant, TenantSuscripcion } from '../../models/suscripcion.model';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-mi-plan',
  standalone: true,
  imports: [CommonModule, DatePipe, NavbarComponent],
  templateUrl: './mi-plan.component.html',
  styleUrls: ['./mi-plan.component.scss']
})
export class MiPlanComponent implements OnInit {
  plan: TenantSuscripcion | null = null;
  cuotas: CuotasTenant | null = null;
  loading = true;
  error = '';

  readonly cuotaClaves: Array<{ key: keyof CuotaValores; label: string; unidad?: string }> = [
    { key: 'talleres', label: 'Talleres' },
    { key: 'tecnicos', label: 'Tecnicos' },
    { key: 'usuarios', label: 'Usuarios' },
    { key: 'incidentes_mensuales', label: 'Incidentes mensuales' },
    { key: 'notificaciones_push', label: 'Notificaciones push' },
    { key: 'almacenamiento_gb', label: 'Almacenamiento', unidad: 'GB' }
  ];

  constructor(private suscripcionService: SuscripcionService) {}

  ngOnInit(): void {
    this.cargarPlan();
  }

  cargarPlan(): void {
    this.loading = true;
    this.error = '';

    this.suscripcionService.obtenerMiPlan().subscribe({
      next: plan => {
        this.plan = plan;
        this.cargarCuotas();
      },
      error: err => {
        console.error('ERROR MI PLAN:', err);
        this.error = err.status === 403
          ? 'No tienes permiso para consultar este plan.'
          : err.error?.detail || 'No se pudo cargar la informacion del plan.';
        this.loading = false;
      }
    });
  }

  cargarCuotas(): void {
    this.suscripcionService.obtenerMisCuotas().subscribe({
      next: cuotas => {
        this.cuotas = cuotas;
        this.loading = false;
      },
      error: err => {
        console.error('ERROR MIS CUOTAS:', err);
        this.error = err.error?.detail || 'No se pudieron cargar las cuotas del plan.';
        this.loading = false;
      }
    });
  }

  diasRestantes(): number {
    const fecha = this.getFechaVencimiento();
    if (!fecha) return 0;
    return Math.max(Math.ceil((new Date(`${fecha}T23:59:59`).getTime() - Date.now()) / 86400000), 0);
  }

  porcentaje(key: keyof CuotaValores): number {
    const limite = Number(this.cuotas?.limites?.[key] || 0);
    const consumo = Number(this.cuotas?.consumo?.[key] || 0);
    if (limite <= 0) return 0;
    return Math.min(Math.round((consumo / limite) * 100), 100);
  }

  estadoClase(): string {
    const estado = this.getEstadoSuscripcion().toUpperCase();
    if (estado === 'ACTIVA' || estado === 'ACTIVO') return 'active';
    if (estado === 'SUSPENDIDA' || estado === 'PENDIENTE_PAGO') return 'suspended';
    return 'expired';
  }

  precioPlan(): string {
    const precio = this.getPrecioPlan();
    if (precio <= 0) return 'Plan gratuito / 0 Bs';
    return `Bs ${precio.toFixed(2)}`;
  }

  getPlanNombre(): string {
    return this.plan?.suscripcion?.plan?.nombre || this.plan?.plan?.nombre || 'Plan Estandar';
  }

  getPrecioPlan(): number {
    return Number(this.plan?.suscripcion?.plan?.precio ?? this.plan?.plan?.precio ?? 0);
  }

  getEstadoSuscripcion(): string {
    return String(this.plan?.suscripcion?.estado || this.plan?.estado_suscripcion || 'ACTIVA');
  }

  getFechaInicio(): string {
    return this.plan?.suscripcion?.fecha_inicio || this.plan?.fecha_inicio || '';
  }

  getFechaVencimiento(): string {
    return this.plan?.suscripcion?.fecha_vencimiento || this.plan?.fecha_vencimiento || '';
  }

  getDominio(): string {
    const dominio = this.plan?.dominio;
    if (!dominio) return 'Sin dominio registrado';
    return typeof dominio === 'string' ? dominio : dominio.dominio || 'Sin dominio registrado';
  }

  getEstadoDominio(): string {
    const dominio = this.plan?.dominio;
    if (dominio && typeof dominio !== 'string') return dominio.estado || 'ACTIVO';
    return this.plan?.estado_dominio || 'ACTIVO';
  }

  getPlanDuracion(): number {
    return Number(this.plan?.suscripcion?.plan?.duracion_dias ?? this.plan?.plan?.duracion_dias ?? 30);
  }

  getLimite(key: keyof CuotaValores): number | string {
    const desdeCuotas = this.cuotas?.limites?.[key];
    if (desdeCuotas !== undefined && desdeCuotas !== null) return desdeCuotas;

    const planActual: any = this.plan?.suscripcion?.plan || this.plan?.plan;
    const mapa: Record<keyof CuotaValores, string> = {
      talleres: 'limite_talleres',
      tecnicos: 'limite_tecnicos',
      usuarios: 'limite_usuarios',
      incidentes_mensuales: 'limite_incidentes_mensuales',
      notificaciones_push: 'limite_notificaciones_push',
      almacenamiento_gb: 'limite_almacenamiento_gb'
    };

    const valor = planActual?.[mapa[key]];
    return valor ?? 'No definido';
  }

  tieneAlertaSuscripcion(): boolean {
    const estado = this.getEstadoSuscripcion().toUpperCase();
    return estado === 'VENCIDA' || estado === 'PENDIENTE_PAGO' || estado === 'SUSPENDIDA';
  }
}
