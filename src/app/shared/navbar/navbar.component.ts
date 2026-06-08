import { Component, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Usuario } from '../../models/usuario.model';
import { Notificacion, NotificacionService } from '../../core/services/notificacion.service';

interface NavItem {
  label: string;
  path: string;
  exact?: boolean;
  icon?: 'chat';
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnDestroy {
  usuario: Usuario | null = null;
  menuItems: NavItem[] = [];
  idTallerNav = 0;
  notificacionesAbiertas = false;
  notificacionesLoading = false;
  notificacionesError = '';
  totalNoLeidas = 0;
  notificaciones: Notificacion[] = [];
  menuAbierto = false;
  private notificacionesTimer: any = null;

  constructor(
    private auth: AuthService,
    private router: Router,
    private notificacionService: NotificacionService
  ) {
    this.usuario = this.auth.getUsuarioActual();
    this.configurarMenu();
    this.configurarNotificaciones();

    this.auth.usuario$.subscribe(usuario => {
      this.usuario = usuario;
      this.configurarMenu();
      this.configurarNotificaciones();
    });
  }

  ngOnDestroy(): void {
    this.detenerRefrescoNotificaciones();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth > 1280) {
      this.menuAbierto = false;
    }
  }

  @HostListener('document:keydown.escape')
  cerrarConEscape(): void {
    this.cerrarMenu();
  }

  esAdminPlataforma(): boolean {
    return this.auth.esAdminPlataforma();
  }

  esAdminTaller(): boolean {
    return this.auth.esAdminTaller();
  }
  esTecnico() :boolean {
    return this.auth.esTecnico(); 
  }

  private configurarMenu(): void {
    this.idTallerNav = Number(localStorage.getItem('id_taller') || 0);

    if (this.esAdminPlataforma()) {
      this.menuItems = [
        { label: 'Dashboard', path: '/dashboard', exact: true },
        { label: 'Usuarios', path: '/usuarios' },
        { label: 'Roles', path: '/roles' },
        { label: 'Suscripciones', path: '/suscripciones' },
        { label: 'Talleres', path: '/talleres' },
        { label: 'Técnicos', path: '/tecnicos' },
        { label: 'Bitácora', path: '/bitacora' },
        { label: 'Perfil', path: '/perfil' }
      ];
      return;
    }

    if (this.esAdminTaller()) {
      if (!this.idTallerNav) {
        this.menuItems = [];
        return;
      }

      this.menuItems = [
        { label: 'Dashboard', path: '/admin-taller/dashboard', exact: true },
        { label: 'Técnicos', path: '/admin-taller/tecnicos' },
        { label: 'Incidentes', path: '/incidentes-taller' },
        { label: 'Cotizaciones', path: '/admin-taller/cotizaciones' },
        { label: 'Mi plan', path: '/admin-taller/mi-plan' },
        { label: 'Cobertura', path: '/admin-taller/cobertura' },
        { label: 'Evaluaciones', path: '/admin-taller/evaluaciones' },
        { label: 'Bitácora', path: '/bitacora' }, //arreglar esa bitacora 
        { label: 'Perfil', path: '/perfil' }
      ];
      return;
    }
    if (this.esTecnico()) {
    this.menuItems = [
      { label: 'Dashboard', path: '/tecnico/dashboard', exact: true },
      { label: 'Incidentes', path: '/tecnico/incidentes' },
      { label: 'Chat', path: '/tecnico/chat', icon: 'chat' },
      { label: 'Historial', path: '/tecnico/historial' },
      { label: 'Evaluaciones', path: '/tecnico/evaluaciones' },
      { label: 'Perfil', path: '/perfil' }
    ];
    return;
  }

    this.menuItems = [];
  }

  getBrandLink(): string {
    if (this.esAdminTaller()) {
      return this.idTallerNav ? '/admin-taller/dashboard' : '/login';
    }

    if (this.esAdminPlataforma()) {
      return '/dashboard';
    }
    if (this.esTecnico()) {
      return '/tecnico/dashboard';
    }

    return '/';
  }

  logout(): void {
    this.cerrarMenu();
    this.auth.logout();
    localStorage.removeItem('id_taller');
    this.detenerRefrescoNotificaciones();
    this.router.navigate(['/login']);
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;

    if (!this.menuAbierto) {
      this.notificacionesAbiertas = false;
    }
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
    this.notificacionesAbiertas = false;
  }

  toggleNotificaciones(): void {
    this.notificacionesAbiertas = !this.notificacionesAbiertas;

    if (this.notificacionesAbiertas) {
      this.cargarNotificaciones();
      this.cargarContadorNotificaciones();
    }
  }

  cargarContadorNotificaciones(): void {
    if (!this.esAdminTaller()) return;

    this.notificacionService.obtenerContadorNoLeidas().subscribe({
      next: (data) => {
        this.totalNoLeidas = Number(data?.total_no_leidas || 0);
      },
      error: (err) => {
        console.error('ERROR CONTADOR NOTIFICACIONES:', err);
      }
    });
  }

  cargarNotificaciones(): void {
    if (!this.esAdminTaller()) return;

    this.notificacionesLoading = true;
    this.notificacionesError = '';

    this.notificacionService.listarMisNotificaciones(false, 20).subscribe({
      next: (data) => {
        this.notificaciones = data || [];
        this.notificacionesLoading = false;
      },
      error: (err) => {
        console.error('ERROR NOTIFICACIONES:', err);
        this.notificacionesError = err.error?.detail || 'No se pudieron cargar las notificaciones.';
        this.notificacionesLoading = false;
      }
    });
  }

  abrirNotificacion(notificacion: Notificacion): void {
    const navegar = () => {
      this.notificacionesAbiertas = false;

      if (notificacion.id_incidente) {
        this.router.navigate(['/incidentes-taller'], {
          queryParams: { incidente: notificacion.id_incidente }
        });
      }
    };

    if (notificacion.leido) {
      navegar();
      return;
    }

    this.notificacionService.marcarComoLeida(notificacion.codigo).subscribe({
      next: (resp) => {
        const actualizada = resp?.notificacion || { ...notificacion, leido: true };
        this.notificaciones = this.notificaciones.map(item =>
          item.codigo === notificacion.codigo ? actualizada : item
        );
        this.totalNoLeidas = Math.max(this.totalNoLeidas - 1, 0);
        navegar();
      },
      error: (err) => {
        console.error('ERROR MARCAR NOTIFICACION:', err);
        navegar();
      }
    });
  }

  marcarTodasLeidas(event: MouseEvent): void {
    event.stopPropagation();

    this.notificacionService.marcarTodasComoLeidas().subscribe({
      next: () => {
        this.notificaciones = this.notificaciones.map(item => ({ ...item, leido: true }));
        this.totalNoLeidas = 0;
      },
      error: (err) => {
        console.error('ERROR MARCAR TODAS:', err);
        this.notificacionesError = err.error?.detail || 'No se pudieron marcar todas como leidas.';
      }
    });
  }

  private configurarNotificaciones(): void {
    this.detenerRefrescoNotificaciones();

    if (!this.esAdminTaller()) {
      this.totalNoLeidas = 0;
      this.notificaciones = [];
      this.notificacionesAbiertas = false;
      return;
    }

    this.cargarContadorNotificaciones();
    this.notificacionesTimer = setInterval(() => {
      this.cargarContadorNotificaciones();
    }, 30000);
  }

  private detenerRefrescoNotificaciones(): void {
    if (!this.notificacionesTimer) return;
    clearInterval(this.notificacionesTimer);
    this.notificacionesTimer = null;
  }
}
