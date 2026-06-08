import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SuscripcionService } from '../../core/services/suscripcion.service';
import { CuotaValores, CuotasTenant, TenantSuscripcion } from '../../models/suscripcion.model';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-mi-plan',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, NavbarComponent],
  templateUrl: './mi-plan.component.html',
  styleUrls: ['./mi-plan.component.scss']
})
export class MiPlanComponent implements OnInit {
  plan: TenantSuscripcion | null = null;
  cuotas: CuotasTenant | null = null;
  loading = true;
  accionLoading = false;
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
          ? 'Tu suscripcion esta vencida o suspendida. Renueva tu plan para continuar usando el sistema.'
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
    const fecha = this.plan?.fecha_vencimiento;
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
    const estado = String(this.plan?.estado_suscripcion || '').toUpperCase();
    if (estado === 'ACTIVA') return 'active';
    if (estado === 'SUSPENDIDA' || estado === 'PENDIENTE_PAGO') return 'suspended';
    return 'expired';
  }

  debePagar(): boolean {
    const estado = String(this.plan?.estado_suscripcion || '').toUpperCase();
    return ['PENDIENTE_PAGO', 'VENCIDA', 'SUSPENDIDA'].includes(estado);
  }

  precioPlan(): string {
    return `Bs ${Number(this.plan?.plan?.precio || 0).toFixed(2)}`;
  }

  pagarSuscripcion(): void {
    if (!this.plan?.id) return;

    this.accionLoading = true;
    this.error = '';
    const origin = window.location.origin;

    this.suscripcionService.crearCheckout(this.plan.id, {
      success_url: `${origin}/suscripciones/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/suscripciones/cancel`
    }).subscribe({
      next: checkout => {
        window.location.href = checkout.checkout_url;
      },
      error: err => {
        this.error = err.status === 403
          ? 'Tu suscripcion esta vencida o suspendida. Renueva tu plan para continuar usando el sistema.'
          : err.error?.detail || 'No se pudo iniciar el pago con Stripe.';
        this.accionLoading = false;
      }
    });
  }
}
