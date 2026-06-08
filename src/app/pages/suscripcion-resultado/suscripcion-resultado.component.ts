import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { SuscripcionService } from '../../core/services/suscripcion.service';
import { TenantSuscripcion } from '../../models/suscripcion.model';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-suscripcion-resultado',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, NavbarComponent],
  templateUrl: './suscripcion-resultado.component.html',
  styleUrls: ['./suscripcion-resultado.component.scss']
})
export class SuscripcionResultadoComponent implements OnInit {
  tipo: 'success' | 'cancel' = 'success';
  sessionId = '';
  plan: TenantSuscripcion | null = null;
  loading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private suscripcionService: SuscripcionService
  ) {}

  ngOnInit(): void {
    this.tipo = this.route.snapshot.routeConfig?.path?.includes('cancel') ? 'cancel' : 'success';
    this.sessionId = this.route.snapshot.queryParamMap.get('session_id') || '';

    if (this.tipo === 'success') {
      this.cargarPlan();
    }
  }

  cargarPlan(): void {
    this.loading = true;
    this.error = '';

    this.suscripcionService.obtenerMiPlan().subscribe({
      next: plan => {
        this.plan = plan;
        this.loading = false;
      },
      error: err => {
        this.error = err.error?.detail || 'El pago fue procesado, pero no se pudo actualizar tu plan.';
        this.loading = false;
      }
    });
  }
}
