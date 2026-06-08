import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: 'landing.component.html',
  styleUrls: ['landing.component.scss']
})
export class LandingComponent {
  emergencias = [
    { icon: '🔋', titulo: 'Batería', desc: 'Arranque y carga' },
    { icon: '🛞', titulo: 'Llanta', desc: 'Pinchazo y cambio' },
    { icon: '⚙️', titulo: 'Motor', desc: 'Fallas mecánicas' },
    { icon: '🚗', titulo: 'Choque', desc: 'Asistencia vial' },
    { icon: '🔑', titulo: 'Otros', desc: 'Cerrajería, etc.' }
  ];

  pasos = [
    {
      num: 'Paso 1',
      titulo: 'Reporta tu Emergencia',
      desc: 'Envía tu ubicación GPS, fotos y audio para describir el problema de tu vehículo',
      color: 'orange'
    },
    {
      num: 'Paso 2',
      titulo: 'IA Clasifica el Problema',
      desc: 'Nuestro sistema de IA analiza la información y clasifica el tipo de emergencia automáticamente',
      color: 'teal'
    },
    {
      num: 'Paso 3',
      titulo: 'Recibe Asistencia',
      desc: 'Un técnico del taller más cercano es asignado automáticamente para ayudarte',
      color: 'green'
    }
  ];
}