import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-recuperar-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recuperar-password.component.html',
  styleUrls: ['./recuperar-password.component.scss']
})
export class RecuperarPasswordComponent {
  email = '';
  loading = false;
  success = false;
  error = '';

  constructor(private auth: AuthService) {}

  enviar() {
    this.loading = true;
    this.error = '';
    this.auth.recuperarPassword(this.email).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.detail || 'Error al procesar solicitud';
        this.loading = false;
      }
    });
  }
}