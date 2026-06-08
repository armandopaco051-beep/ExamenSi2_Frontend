import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: 'login.component.html',
  styleUrls: ['login.component.scss']
})
export class LoginComponent {
  identificador = '';
  password = '';
  loading = false;
  error = '';
  submitted = false;

  constructor(private auth: AuthService, private router: Router) {}

  onLogin(form: NgForm): void {
    this.submitted = true;

    if (form.invalid) {
      this.error = 'Completa los campos requeridos';
      return;
    }

    this.loading = true;
    this.error = '';

    this.auth.login({ identificador: this.identificador, password: this.password }).subscribe({
      next: (resp) => {
        const usuario = resp.usuario;

        if (usuario.id_rol === 1) {
          this.router.navigate(['/dashboard']);
          return;
        }

        if (usuario.id_rol === 2) {
          const idTaller = localStorage.getItem('id_taller');

          if (!idTaller) {
            this.error = 'No se encontro el taller asociado al usuario.';
            this.loading = false;
            return;
          }

          this.router.navigate(['/admin-taller/dashboard']);
          return;
        }

        if (usuario.id_rol === 3) {
          this.router.navigate(['/tecnico/dashboard']);
          return;
        }

        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.error = err.error?.detail || 'Error al iniciar sesion';
        this.loading = false;
      }
    });
  }
}
