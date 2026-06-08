import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permisoGuard, rolGuard } from './core/guards/rol.guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
         import('./pages/landing/landing.component').then(m => m.LandingComponent)
    },
    {
        path: 'login', 
        loadComponent : () => import ('./pages/login/login.components').then(m => m.LoginComponent)
    },
    {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro.component').then(m => m.RegistroComponent)
    },
    {
    path: 'recuperar-password',
    loadComponent: () => import('./pages/recuperar-password/recuperar-password.component').then(m => m.RecuperarPasswordComponent)
    },
    {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboart.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
    {
    path: 'usuarios',
    loadComponent: () => import('./pages/usuarios/usuario.component').then(m => m.UsuariosComponent),
    canActivate: [rolGuard([1, 2])] // Admin plataforma y admin taller
  },
  {
    path: 'roles',
    loadComponent: () => import('./pages/roles/roles.component').then(m => m.RolesComponent),
    canActivate: [rolGuard([1])] // Solo admin plataforma
  },
  {
    path: 'suscripciones',
    loadComponent: () =>
      import('./pages/suscripciones-admin/suscripciones-admin.component')
        .then(m => m.SuscripcionesAdminComponent),
    canActivate: [authGuard, rolGuard([1])]
  },
  // Stripe checkout temporalmente deshabilitado hasta ajustar el backend/flujo:
  // {
  //   path: 'suscripciones/pagos',
  //   loadComponent: () =>
  //     import('./pages/suscripciones-pagos/suscripciones-pagos.component')
  //       .then(m => m.SuscripcionesPagosComponent),
  //   canActivate: [authGuard, rolGuard([1])]
  // },
  // {
  //   path: 'suscripciones/success',
  //   loadComponent: () =>
  //     import('./pages/suscripcion-resultado/suscripcion-resultado.component')
  //       .then(m => m.SuscripcionResultadoComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'suscripciones/cancel',
  //   loadComponent: () =>
  //     import('./pages/suscripcion-resultado/suscripcion-resultado.component')
  //       .then(m => m.SuscripcionResultadoComponent),
  //   canActivate: [authGuard]
  // },
  {
    path: 'incidentes-taller',
    loadComponent: () => import('./pages/incidentes-taller/incidentes-taller.component').then(m => m.IncidentesTallerComponent),
    canActivate: [authGuard, rolGuard([2])] // Solo admin taller
  },
   {
    path: 'admin-taller/dashboard',
    canActivate: [authGuard, rolGuard([2])],
    loadComponent: () =>
      import('./pages/dashboard-taller/dashboard-taller.component').then(m => m.DashboardTallerComponent)
  },
  {
    path: 'admin-taller/dashboard/:idTaller',
    redirectTo: 'admin-taller/dashboard',
    pathMatch: 'full'
  },
  {
    path : 'admin-taller/tecnicos',
    loadComponent: () => import('./pages/tecnicos-taller/tecnicos-taller.component').then(m => m.TecnicosTallerComponent),
    
    canActivate: [authGuard, rolGuard([2])] // Solo admin taller
  
  },
  {
    path: 'admin-taller/cobertura',
    loadComponent: () => import('./pages/cobertura-taller/cobertura-taller.component').then(m => m.CoberturaTallerComponent),
    canActivate: [authGuard, rolGuard([2])] // Solo admin taller
  },
  {
    path: 'admin-taller/evaluaciones',
    loadComponent: () => import('./pages/evaluaciones-taller/evaluaciones-taller.component').then(m => m.EvaluacionesTallerComponent),
    canActivate: [authGuard, rolGuard([2])] // Solo admin taller
  },
  {
    path: 'admin-taller/cotizaciones',
    loadComponent: () =>
      import('./pages/cotizaciones-taller/cotizaciones-taller.component')
        .then(m => m.CotizacionesTallerComponent),
    canActivate: [authGuard, rolGuard([2])]
  },
  {
    path: 'admin-taller/mi-plan',
    loadComponent: () =>
      import('./pages/mi-plan/mi-plan.component').then(m => m.MiPlanComponent),
    canActivate: [authGuard, rolGuard([2])]
  },
  // Stripe checkout temporalmente deshabilitado hasta ajustar el backend/flujo:
  // {
  //   path: 'admin-taller/planes',
  //   loadComponent: () =>
  //     import('./pages/suscripciones-planes/suscripciones-planes.component')
  //       .then(m => m.SuscripcionesPlanesComponent),
  //   canActivate: [authGuard, rolGuard([2])]
  // },
  // {
  //   path: 'admin-taller/suscripcion-pagos',
  //   loadComponent: () =>
  //     import('./pages/suscripciones-pagos/suscripciones-pagos.component')
  //       .then(m => m.SuscripcionesPagosComponent),
  //   canActivate: [authGuard, rolGuard([2])]
  // },
  
  {
    path: 'bitacora',
    loadComponent: () => import('./pages/bitacora/bitacora.component').then(m => m.BitacoraComponent),
    canActivate: [authGuard, rolGuard([1, 2])] // Admin plataforma y admin taller
  },
  {
    path: 'perfil',
    loadComponent: () => import('./pages/perfil/perfil.component').then(m => m.PerfilComponent),
    canActivate: [authGuard]
  },
  {
    path: 'talleres',
    loadComponent: () => import('./pages/talleres/talleres.component').then(m => m.TalleresComponent),
    canActivate: [rolGuard([1, 2])] // Admin plataforma y admin taller
  },
  {
    path: 'tecnicos',
    loadComponent: () => import('./pages/tecnicos/tecnicos.component').then(m => m.TecnicosComponent),
    canActivate: [rolGuard([1, 2])] // Admin plataforma y admin taller
  },
  {
  path: 'tecnico/dashboard',
  loadComponent: () =>
    import('./pages/dashboard-tecnicos/dashboard-tecnico.component')
      .then(m => m.TecnicoDashboardComponent),
  canActivate: [authGuard, rolGuard([3])]
},
{
  path: 'tecnico/incidentes',
  loadComponent: () =>
    import('./pages/incidentes-tecnicos/tecnico_incidente.component')
      .then(m => m.TecnicoIncidentesComponent),
  canActivate: [authGuard, rolGuard([3])]
},
{
  path: 'tecnico/chat',
  loadComponent: () =>
    import('./pages/chat-tecnico/chat-tecnico.component')
      .then(m => m.ChatTecnicoComponent),
  canActivate: [authGuard, rolGuard([3])]
},
{
  path: 'tecnico/historial',
  loadComponent: () =>
    import('./pages/historial-tecnico/tecnico-historial.component')
      .then(m => m.TecnicoHistorialComponent),
  canActivate: [authGuard, rolGuard([3])]
},
{
  path: 'tecnico/evaluaciones',
  loadComponent: () =>
    import('./pages/evaluaciones-tecnico/evaluaciones-tecnico.component')
      .then(m => m.EvaluacionesTecnicoComponent),
  canActivate: [authGuard, rolGuard([3])]
},
  { path: '**', redirectTo: 'login' }
];
