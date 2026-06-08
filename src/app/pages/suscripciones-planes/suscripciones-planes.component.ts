import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { SuscripcionService } from '../../core/services/suscripcion.service';
import { PlanSuscripcion, TenantSuscripcion } from '../../models/suscripcion.model';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-suscripciones-planes',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './suscripciones-planes.component.html',
  styleUrls: ['./suscripciones-planes.component.scss']
})
export class SuscripcionesPlanesComponent implements OnInit {
  planes: PlanSuscripcion[] = [];
  miPlan: TenantSuscripcion | null = null;
  loading = true;
  accionLoading = false;
  error = '';
  planProcesando = 0;

  constructor(private suscripcionService: SuscripcionService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = '';

    this.suscripcionService.obtenerMiPlan().subscribe({
      next: plan => {
        this.miPlan = plan;
        this.cargarPlanes();
      },
      error: err => {
        this.error = this.mensajeError(err, 'No se pudo cargar tu suscripcion.');
        this.loading = false;
      }
    });
  }

  cargarPlanes(): void {
    this.suscripcionService.listarPlanes().subscribe({
      next: planes => {
        this.planes = planes || [];
        this.loading = false;
      },
      error: err => {
        this.error = this.mensajeError(err, 'No se pudieron cargar los planes.');
        this.loading = false;
      }
    });
  }

  seleccionarPlan(plan: PlanSuscripcion): void {
    if (!this.miPlan?.id || !plan?.id) return;

    this.accionLoading = true;
    this.planProcesando = plan.id;
    this.error = '';

    this.suscripcionService.cambiarPlan(this.miPlan.id, plan.id).subscribe({
      next: () => this.crearCheckout(this.miPlan!.id),
      error: err => {
        this.error = this.mensajeError(err, 'No se pudo cambiar el plan.');
        this.accionLoading = false;
        this.planProcesando = 0;
      }
    });
  }

  pagarPlanActual(): void {
    if (!this.miPlan?.id) return;
    this.accionLoading = true;
    this.planProcesando = Number(this.miPlan.plan?.id || 0);
    this.error = '';
    this.crearCheckout(this.miPlan.id);
  }

  precio(plan: PlanSuscripcion | undefined): string {
    return `Bs ${Number(plan?.precio || 0).toFixed(2)}`;
  }

  caracteristicas(plan: PlanSuscripcion): string[] {
    if (Array.isArray(plan.caracteristicas)) return plan.caracteristicas;
    if (typeof plan.caracteristicas === 'string') {
      return plan.caracteristicas.split('|').map(item => item.trim()).filter(Boolean);
    }

    return [
      `${plan.limite_tecnicos} tecnicos`,
      `${plan.limite_usuarios} usuarios`,
      `${plan.limite_incidentes_mensuales} incidentes mensuales`,
      `${plan.limite_almacenamiento_gb} GB de almacenamiento`
    ];
  }

  esPlanActual(plan: PlanSuscripcion): boolean {
    return Number(this.miPlan?.plan?.id || 0) === Number(plan.id);
  }

  private crearCheckout(idTenant: number): void {
    const origin = window.location.origin;

    this.suscripcionService.crearCheckout(idTenant, {
      success_url: `${origin}/suscripciones/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/suscripciones/cancel`
    }).subscribe({
      next: checkout => {
        window.location.href = checkout.checkout_url;
      },
      error: err => {
        this.error = this.mensajeError(err, 'No se pudo iniciar el pago con Stripe.');
        this.accionLoading = false;
        this.planProcesando = 0;
      }
    });
  }

  private mensajeError(err: any, fallback: string): string {
    if (err?.status === 403) {
      return 'Tu suscripcion esta vencida o suspendida. Renueva tu plan para continuar usando el sistema.';
    }
    return err?.error?.detail || err?.error?.mensaje || fallback;
  }
}
