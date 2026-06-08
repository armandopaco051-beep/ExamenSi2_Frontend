import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { TecnicoDashboardService } from '../../core/services/dashboardTecnico.service';

@Component({
  selector: 'app-tecnico-historial',
  standalone: true,
  imports: [CommonModule, DatePipe, NavbarComponent],
  templateUrl: './tecnico-historial.component.html',
  styleUrl: './tecnico-historial.component.scss'
})
export class TecnicoHistorialComponent implements OnInit {
  loading = true;
  error = '';

  // ✅ CAMBIO: historial real desde backend
  historial: any[] = [];

  constructor(
    private tecnicoService: TecnicoDashboardService
  ) {}

  ngOnInit(): void {
    this.cargarHistorial();
  }

  cargarHistorial(): void {
    this.loading = true;
    this.error = '';

    this.tecnicoService.obtenerHistorial().subscribe({
      next: (data: any[]) => {
        console.log('HISTORIAL TÉCNICO:', data);
        this.historial = data || [];
        this.loading = false;
      },
      error: (err: any) => {
        console.error('ERROR HISTORIAL TÉCNICO:', err);
        this.error = err.error?.detail || 'No se pudo cargar el historial.';
        this.loading = false;
      }
    });
  }
}