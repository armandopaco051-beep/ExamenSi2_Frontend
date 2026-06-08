import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';
import {
  EvaluacionService,
  EvaluacionServicio,
  ResumenEvaluacionTaller
} from '../../core/services/evaluacion.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-evaluaciones-taller',
  standalone: true,
  imports: [CommonModule, DatePipe, NavbarComponent],
  templateUrl: './evaluaciones-taller.component.html',
  styleUrls: ['./evaluaciones-taller.component.scss']
})
export class EvaluacionesTallerComponent implements OnInit {
  loading = true;
  error = '';
  resumen: ResumenEvaluacionTaller | null = null;

  constructor(
    private authService: AuthService,
    private evaluacionService: EvaluacionService
  ) {}

  ngOnInit(): void {
    this.cargarEvaluaciones();
  }

  cargarEvaluaciones(): void {
    const idTaller = Number(localStorage.getItem('id_taller') || 0);
    const token = this.authService.getToken() || '';

    if (!idTaller || !token) {
      this.loading = false;
      this.error = 'No se encontro el taller del administrador logueado.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.evaluacionService.obtenerEvaluacionesTaller(idTaller, token).subscribe({
      next: (data) => {
        this.resumen = {
          ...data,
          evaluaciones: data.evaluaciones || []
        };
        this.loading = false;
      },
      error: (err) => {
        console.error('ERROR EVALUACIONES TALLER:', err);
        this.error = err.status === 403
          ? 'No tienes permiso para acceder a la información de este taller.'
          : err.error?.detail || 'No se pudieron cargar las evaluaciones del taller.';
        this.loading = false;
      }
    });
  }

  estrellas(valor: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i + 1).map(i => i <= Math.round(Number(valor || 0)) ? 1 : 0);
  }

  getEvaluaciones(): EvaluacionServicio[] {
    return this.resumen?.evaluaciones || [];
  }
}
