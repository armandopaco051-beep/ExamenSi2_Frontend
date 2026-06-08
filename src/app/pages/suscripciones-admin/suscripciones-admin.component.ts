import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { SuscripcionService } from '../../core/services/suscripcion.service';
import { TallerService } from '../../core/services/taller.service';
import {
  CrearTenantPayload,
  CuotaValores,
  CuotasTenant,
  EstadoSuscripcion,
  TenantSuscripcion
} from '../../models/suscripcion.model';
import { Taller } from '../../models/taller.model';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-suscripciones-admin',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, RouterLink, NavbarComponent],
  templateUrl: './suscripciones-admin.component.html',
  styleUrls: ['./suscripciones-admin.component.scss']
})
export class SuscripcionesAdminComponent implements OnInit {
  tenants: TenantSuscripcion[] = [];
  talleres: Taller[] = [];
  loading = true;
  accionLoading = false;
  error = '';
  mensajeExito = '';

  mostrarCrear = false;
  mostrarCuotas = false;
  tenantSeleccionado: TenantSuscripcion | null = null;
  cuotasSeleccionadas: CuotasTenant | null = null;
  loadingCuotas = false;

  renovarDias = 30;
  estadoSeleccionado: EstadoSuscripcion = 'ACTIVA';
  estados: EstadoSuscripcion[] = ['ACTIVA', 'VENCIDA', 'SUSPENDIDA', 'CANCELADA'];

  formTenant: CrearTenantPayload = this.formInicial();

  readonly cuotaClaves: Array<{ key: keyof CuotaValores; label: string; unidad?: string }> = [
    { key: 'talleres', label: 'Talleres' },
    { key: 'tecnicos', label: 'Tecnicos' },
    { key: 'usuarios', label: 'Usuarios' },
    { key: 'incidentes_mensuales', label: 'Incidentes mensuales' },
    { key: 'notificaciones_push', label: 'Notificaciones push' },
    { key: 'almacenamiento_gb', label: 'Almacenamiento', unidad: 'GB' }
  ];

  constructor(
    private suscripcionService: SuscripcionService,
    private tallerService: TallerService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = '';

    this.suscripcionService.listarTenants().subscribe({
      next: tenants => {
        this.tenants = tenants || [];
        this.cargarTalleres();
      },
      error: err => {
        console.error('ERROR TENANTS:', err);
        this.error = err.error?.detail || 'No se pudieron cargar los tenants y suscripciones.';
        this.loading = false;
      }
    });
  }

  cargarTalleres(): void {
    this.tallerService.listar().subscribe({
      next: talleres => {
        this.talleres = talleres || [];
        this.loading = false;
      },
      error: err => {
        console.error('ERROR TALLERES TENANT:', err);
        this.error = err.error?.detail || 'No se pudieron cargar los talleres disponibles.';
        this.loading = false;
      }
    });
  }

  get talleresSinTenant(): Taller[] {
    const idsConTenant = new Set(this.tenants.map(item => Number(item.id_taller)));
    return this.talleres.filter(taller => !idsConTenant.has(Number(taller.codigo)));
  }

  get totalActivas(): number {
    return this.tenants.filter(item => item.estado_suscripcion === 'ACTIVA').length;
  }

  get totalSuspendidas(): number {
    return this.tenants.filter(item => item.estado_suscripcion === 'SUSPENDIDA').length;
  }

  get totalPorVencer(): number {
    return this.tenants.filter(item => {
      const dias = this.diasRestantes(item.fecha_vencimiento);
      return item.estado_suscripcion === 'ACTIVA' && dias >= 0 && dias <= 7;
    }).length;
  }

  abrirCrear(): void {
    this.formTenant = this.formInicial();
    this.error = '';
    this.mensajeExito = '';
    this.mostrarCrear = true;
  }

  cerrarCrear(): void {
    this.mostrarCrear = false;
    this.formTenant = this.formInicial();
  }

  seleccionarTaller(idTaller: number): void {
    const taller = this.talleres.find(item => item.codigo === Number(idTaller));
    if (!taller) return;

    const slug = this.crearSlug(taller.nombre, taller.codigo);
    this.formTenant.nombre = taller.nombre;
    this.formTenant.slug = slug;
    this.formTenant.dominio = `${slug}.emergvial.com`;
  }

  crearTenant(): void {
    if (!this.formTenant.id_taller || !this.formTenant.nombre.trim() || !this.formTenant.slug.trim()) {
      this.error = 'Selecciona un taller y completa nombre, slug y dominio.';
      return;
    }

    this.accionLoading = true;
    this.error = '';

    this.suscripcionService.crearTenant({
      ...this.formTenant,
      nombre: this.formTenant.nombre.trim(),
      slug: this.formTenant.slug.trim(),
      dominio: this.formTenant.dominio.trim()
    }).subscribe({
      next: tenant => {
        this.tenants = [...this.tenants, tenant];
        this.mensajeExito = 'Tenant creado correctamente.';
        this.accionLoading = false;
        this.cerrarCrear();
        this.cargarDatos();
      },
      error: err => {
        console.error('ERROR CREAR TENANT:', err);
        this.error = err.error?.detail || 'No se pudo crear el tenant.';
        this.accionLoading = false;
      }
    });
  }

  abrirGestion(tenant: TenantSuscripcion): void {
    this.tenantSeleccionado = tenant;
    this.renovarDias = Number(tenant.plan?.duracion_dias || 30);
    this.estadoSeleccionado = this.esEstadoValido(tenant.estado_suscripcion)
      ? tenant.estado_suscripcion as EstadoSuscripcion
      : 'ACTIVA';
    this.cargarCuotas(tenant);
  }

  cargarCuotas(tenant: TenantSuscripcion): void {
    this.mostrarCuotas = true;
    this.loadingCuotas = true;
    this.cuotasSeleccionadas = null;
    this.error = '';

    this.suscripcionService.obtenerCuotasTenant(tenant.id).subscribe({
      next: cuotas => {
        this.cuotasSeleccionadas = cuotas;
        this.loadingCuotas = false;
      },
      error: err => {
        console.error('ERROR CUOTAS TENANT:', err);
        this.error = err.error?.detail || 'No se pudieron cargar las cuotas del tenant.';
        this.loadingCuotas = false;
      }
    });
  }

  cerrarGestion(): void {
    this.mostrarCuotas = false;
    this.tenantSeleccionado = null;
    this.cuotasSeleccionadas = null;
  }

  renovar(): void {
    if (!this.tenantSeleccionado || this.renovarDias <= 0) return;

    this.accionLoading = true;
    this.error = '';

    this.suscripcionService.renovarTenant(this.tenantSeleccionado.id, Number(this.renovarDias)).subscribe({
      next: () => {
        this.mensajeExito = `Suscripcion renovada por ${this.renovarDias} dias.`;
        this.accionLoading = false;
        this.cerrarGestion();
        this.cargarDatos();
      },
      error: err => {
        console.error('ERROR RENOVAR TENANT:', err);
        this.error = err.error?.detail || 'No se pudo renovar la suscripcion.';
        this.accionLoading = false;
      }
    });
  }

  cambiarEstado(): void {
    if (!this.tenantSeleccionado) return;

    this.accionLoading = true;
    this.error = '';

    this.suscripcionService.cambiarEstado(this.tenantSeleccionado.id, this.estadoSeleccionado).subscribe({
      next: () => {
        this.mensajeExito = `Suscripcion cambiada a ${this.estadoSeleccionado}.`;
        this.accionLoading = false;
        this.cerrarGestion();
        this.cargarDatos();
      },
      error: err => {
        console.error('ERROR ESTADO TENANT:', err);
        this.error = err.error?.detail || 'No se pudo cambiar el estado de la suscripcion.';
        this.accionLoading = false;
      }
    });
  }

  diasRestantes(fecha: string): number {
    if (!fecha) return 0;
    const vencimiento = new Date(`${fecha}T23:59:59`);
    return Math.ceil((vencimiento.getTime() - Date.now()) / 86400000);
  }

  porcentajeCuota(key: keyof CuotaValores): number {
    const limite = Number(this.cuotasSeleccionadas?.limites?.[key] || 0);
    const consumo = Number(this.cuotasSeleccionadas?.consumo?.[key] || 0);
    if (limite <= 0) return 0;
    return Math.min(Math.round((consumo / limite) * 100), 100);
  }

  estadoClase(estado: string): string {
    const valor = String(estado || '').toUpperCase();
    if (valor === 'ACTIVA' || valor === 'ACTIVO') return 'active';
    if (valor === 'SUSPENDIDA') return 'suspended';
    if (valor === 'VENCIDA' || valor === 'CANCELADA') return 'expired';
    return 'neutral';
  }

  private formInicial(): CrearTenantPayload {
    return {
      nombre: '',
      slug: '',
      dominio: '',
      id_taller: 0,
      tipo_dominio: 'SUBDOMINIO'
    };
  }

  private crearSlug(nombre: string, codigo: number): string {
    const base = nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `${base}-${codigo}`;
  }

  private esEstadoValido(estado: string): boolean {
    return this.estados.includes(estado as EstadoSuscripcion);
  }
}
