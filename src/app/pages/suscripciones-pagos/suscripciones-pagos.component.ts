import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { SuscripcionService } from '../../core/services/suscripcion.service';
import { ComprobanteSuscripcion, PagoSuscripcion } from '../../models/suscripcion.model';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-suscripciones-pagos',
  standalone: true,
  imports: [CommonModule, DatePipe, NavbarComponent],
  templateUrl: './suscripciones-pagos.component.html',
  styleUrls: ['./suscripciones-pagos.component.scss']
})
export class SuscripcionesPagosComponent implements OnInit {
  idTenant = 0;
  pagos: PagoSuscripcion[] = [];
  comprobantes: ComprobanteSuscripcion[] = [];
  comprobanteSeleccionado: ComprobanteSuscripcion | null = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private suscripcionService: SuscripcionService
  ) {}

  ngOnInit(): void {
    const idTenantQuery = Number(this.route.snapshot.queryParamMap.get('tenant') || 0);
    if (idTenantQuery) {
      this.idTenant = idTenantQuery;
      this.cargarHistorial();
      return;
    }

    this.suscripcionService.obtenerMiPlan().subscribe({
      next: plan => {
        this.idTenant = Number(plan.id);
        this.cargarHistorial();
      },
      error: err => {
        this.error = this.mensajeError(err, 'No se pudo identificar el tenant.');
        this.loading = false;
      }
    });
  }

  cargarHistorial(): void {
    if (!this.idTenant) return;

    this.loading = true;
    this.error = '';

    this.suscripcionService.listarPagosTenant(this.idTenant).subscribe({
      next: pagos => {
        this.pagos = pagos || [];
        this.cargarComprobantes();
      },
      error: err => {
        this.error = this.mensajeError(err, 'No se pudo cargar el historial de pagos.');
        this.loading = false;
      }
    });
  }

  cargarComprobantes(): void {
    this.suscripcionService.listarComprobantesTenant(this.idTenant).subscribe({
      next: comprobantes => {
        this.comprobantes = comprobantes || [];
        this.loading = false;
      },
      error: () => {
        this.comprobantes = [];
        this.loading = false;
      }
    });
  }

  verComprobante(idComprobante: number | null | undefined): void {
    if (!idComprobante) return;

    this.suscripcionService.obtenerComprobante(Number(idComprobante)).subscribe({
      next: comprobante => {
        this.comprobanteSeleccionado = comprobante;
      },
      error: err => {
        this.error = this.mensajeError(err, 'No se pudo cargar el comprobante.');
      }
    });
  }

  cerrarComprobante(): void {
    this.comprobanteSeleccionado = null;
  }

  buscarComprobantePago(pago: PagoSuscripcion): ComprobanteSuscripcion | undefined {
    return this.comprobantes.find(item =>
      Number(item.id || item.id_comprobante) === Number(pago.id_comprobante)
    );
  }

  monto(valor: number | undefined): string {
    return `Bs ${Number(valor || 0).toFixed(2)}`;
  }

  fechaPago(pago: PagoSuscripcion): string {
    return pago.fecha_pago || pago.fecha_creacion || '';
  }

  idComprobante(pago: PagoSuscripcion): number {
    const directo = Number(pago.id_comprobante || 0);
    if (directo) return directo;
    const comprobante = this.buscarComprobantePago(pago);
    return Number(comprobante?.id || comprobante?.id_comprobante || 0);
  }

  private mensajeError(err: any, fallback: string): string {
    if (err?.status === 403) {
      return 'Tu suscripcion esta vencida o suspendida. Renueva tu plan para continuar usando el sistema.';
    }
    return err?.error?.detail || err?.error?.mensaje || fallback;
  }
}
