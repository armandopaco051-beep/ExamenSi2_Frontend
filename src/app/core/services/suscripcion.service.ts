import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroments';
import {
  CheckoutSuscripcionPayload,
  CheckoutSuscripcionResponse,
  ComprobanteSuscripcion,
  CrearTenantPayload,
  CuotasTenant,
  EstadoSuscripcion,
  PagoSuscripcion,
  PlanSuscripcion,
  TenantSuscripcion
} from '../../models/suscripcion.model';

@Injectable({ providedIn: 'root' })
export class SuscripcionService {
  private apiUrl = `${environment.apiUrl}/suscripciones`;

  constructor(private http: HttpClient) {}

  obtenerPlanEstandar(): Observable<PlanSuscripcion> {
    return this.http.get<PlanSuscripcion>(`${this.apiUrl}/plan-estandar`);
  }

  listarPlanes(): Observable<PlanSuscripcion[]> {
    return this.http.get<any>(`${this.apiUrl}/planes`).pipe(
      map(response => {
        if (Array.isArray(response)) return response;
        return response?.planes || response?.data || [];
      })
    );
  }

  listarTenants(): Observable<TenantSuscripcion[]> {
    return this.http.get<any>(`${this.apiUrl}/tenants`).pipe(
      map(response => {
        if (Array.isArray(response)) return response;
        return response?.tenants || response?.data || [];
      })
    );
  }

  crearTenant(payload: CrearTenantPayload): Observable<TenantSuscripcion> {
    return this.http.post<TenantSuscripcion>(`${this.apiUrl}/tenants`, payload);
  }

  obtenerTenant(idTenant: number): Observable<TenantSuscripcion> {
    return this.http.get<TenantSuscripcion>(`${this.apiUrl}/tenants/${idTenant}`);
  }

  obtenerCuotasTenant(idTenant: number): Observable<CuotasTenant> {
    return this.http.get<CuotasTenant>(`${this.apiUrl}/tenants/${idTenant}/cuotas`);
  }

  renovarTenant(idTenant: number, duracionDias: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/tenants/${idTenant}/renovar`, {
      duracion_dias: duracionDias
    });
  }

  cambiarEstado(idTenant: number, estado: EstadoSuscripcion): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/tenants/${idTenant}/estado`, { estado });
  }

  cambiarPlan(idTenant: number, idPlan: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/tenants/${idTenant}/plan`, {
      id_plan: idPlan
    });
  }

  crearCheckout(
    idTenant: number,
    payload: CheckoutSuscripcionPayload
  ): Observable<CheckoutSuscripcionResponse> {
    return this.http.post<CheckoutSuscripcionResponse>(
      `${this.apiUrl}/tenants/${idTenant}/checkout`,
      payload
    );
  }

  listarPagosTenant(idTenant: number): Observable<PagoSuscripcion[]> {
    return this.http.get<any>(`${this.apiUrl}/tenants/${idTenant}/pagos`).pipe(
      map(response => {
        if (Array.isArray(response)) return response;
        return response?.pagos || response?.data || [];
      })
    );
  }

  listarComprobantesTenant(idTenant: number): Observable<ComprobanteSuscripcion[]> {
    return this.http.get<any>(`${this.apiUrl}/tenants/${idTenant}/comprobantes`).pipe(
      map(response => {
        if (Array.isArray(response)) return response;
        return response?.comprobantes || response?.data || [];
      })
    );
  }

  obtenerComprobante(idComprobante: number): Observable<ComprobanteSuscripcion> {
    return this.http.get<ComprobanteSuscripcion>(`${this.apiUrl}/comprobantes/${idComprobante}`);
  }

  regularizarTenantsGratis(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/backfill/tenants-gratis`, null);
  }

  obtenerMiPlan(): Observable<TenantSuscripcion> {
    return this.http.get<TenantSuscripcion>(`${this.apiUrl}/mi-plan`);
  }

  obtenerMisCuotas(): Observable<CuotasTenant> {
    return this.http.get<CuotasTenant>(`${this.apiUrl}/mi-plan/cuotas`);
  }

  resolverDominio(dominio: string): Observable<any> {
    const params = new HttpParams().set('dominio', dominio);
    return this.http.get<any>(`${this.apiUrl}/resolver-dominio`, { params });
  }
}
