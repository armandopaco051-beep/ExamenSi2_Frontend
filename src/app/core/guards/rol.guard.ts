import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

function getRutaPorRol(idRol: number | undefined): string {
  if (idRol === 1) return '/dashboard';
  if (idRol === 2) return '/admin-taller/dashboard';
  return '/login';
}

export const rolGuard = (rolesPermitidos: number[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
      router.navigate(['/login']);
      return false;
    }

    const usuario = auth.getUsuarioActual();

    if (usuario && rolesPermitidos.includes(usuario.id_rol)) {
      return true;
    }

    router.navigate([getRutaPorRol(usuario?.id_rol)]);
    return false;
  };
};

export const permisoGuard = (permiso: string): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
      router.navigate(['/login']);
      return false;
    }

    if (auth.tienePermiso(permiso)) {
      return true;
    }

    const usuario = auth.getUsuarioActual();
    router.navigate([getRutaPorRol(usuario?.id_rol)]);
    return false;
  };
};