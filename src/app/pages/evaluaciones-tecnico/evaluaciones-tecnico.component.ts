import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';
import {
  EvaluacionService,
  EvaluacionServicio,
  ResumenEvaluacionTecnico
} from '../../core/services/evaluacion.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-evaluaciones-tecnico',
  standalone: true,
  imports: [CommonModule, DatePipe, NavbarComponent],
  templateUrl: './evaluaciones-tecnico.component.html',
  styleUrls: ['./evaluaciones-tecnico.component.scss']
})
export class EvaluacionesTecnicoComponent implements OnInit {
  loading = true;
  error = '';
  resumen: ResumenEvaluacionTecnico | null = null;

  constructor(
    private authService: AuthService,
    private evaluacionService: EvaluacionService
  ) {}

  ngOnInit(): void {
    this.cargarEvaluaciones();
  }

  cargarEvaluaciones(): void {
    const usuario = this.authService.getUsuarioActual();
    const codigoTecnico = usuario?.codigo || '';
    const token = this.authService.getToken() || '';

    if (!codigoTecnico || !token) {
      this.loading = false;
      this.error = 'No se encontro la sesion del tecnico.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.evaluacionService.obtenerResumenTecnico(codigoTecnico, token).subscribe({
      next: (data) => {
        this.resumen = {
          ...data,
          ultimas_evaluaciones: data.ultimas_evaluaciones || []
        };
        this.loading = false;
      },
      error: (err) => {
        console.error('ERROR EVALUACIONES TECNICO:', err);
        this.error = err.error?.detail || 'No se pudieron cargar tus evaluaciones.';
        this.loading = false;
      }
    });
  }

  estrellas(valor: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i + 1).map(i => i <= Math.round(Number(valor || 0)) ? 1 : 0);
  }

  getEvaluaciones(): EvaluacionServicio[] {
    return this.resumen?.ultimas_evaluaciones || [];
  }
}
