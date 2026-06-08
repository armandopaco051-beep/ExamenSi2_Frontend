import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { UsuarioService } from '../../core/services/usuario.service';
import { AuthService } from '../../core/services/auth.service';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  usuario: Usuario | null = null;
  form = { nombre: '', apellidos: '', email: '', telefono: '' };
  passwordForm = { password: '', confirmar: '' };
  loading = false;
  loadingPass = false;
  successPerfil = false;
  successPass = false;
  error = '';
  errorPass = '';

  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.usuario = this.authService.getUsuarioStorage();
    if (this.usuario) {
      this.form = {
        nombre: this.usuario.nombre,
        apellidos: this.usuario.apellido,
        email: this.usuario.email,
        telefono: this.usuario.telefono
      };
    }
  }

  guardarPerfil() {
  if (!this.usuario) return;

  this.loading = true;
  this.error = '';

  this.usuarioService.actualizar(this.usuario.codigo, this.form).subscribe({
    next: (updated) => {
      this.usuario = updated;
      localStorage.setItem('usuario', JSON.stringify(updated));

      this.successPerfil = true;
      setTimeout(() => this.successPerfil = false, 3000);

      this.loading = false;
      alert('Perfil actualizado correctamente');
    },
    error: (err) => {
      this.error = err.error?.detail || 'Error al actualizar perfil';
      this.loading = false;
      console.error('Error al actualizar:', err);
    }
  });
  }

  cambiarPassword() {
   this.authService.cambiarPassword(
    this.usuario!.email,
    this.passwordForm.password,
    this.passwordForm.confirmar
).subscribe({
  next: () => {
    this.successPass = true;
    this.passwordForm = { password: '', confirmar: '' };
    setTimeout(() => this.successPass = false, 3000);
    this.loadingPass = false;
    alert('Password cambiado correctamente');
  },
  error: (err) => {
    this.errorPass = err.error?.detail || 'Error al cambiar password';
    this.loadingPass = false;
  }
});
  }

  getInitial(): string {
    return this.usuario?.nombre?.charAt(0).toUpperCase() || 'U';
  }
  Esadmin(): string {
    if (this.usuario?.rol == '2') {
      return 'Administrador de Taller';
    } else {
      return 'Administrador de Plataforma';
    }
  }
}