import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroments';

export interface ConceptoCobro {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  descripcion?: string;
  precio_unitario: number;
  activo: boolean;
  id_taller?: number | null;
}

export interface ConceptoCobroSeleccionado {
  id_concepto: number;
  cantidad: number;
  observacion?: string;
}

export interface RegistrarConceptosCobroPayload {
  conceptos: ConceptoCobroSeleccionado[];
  descuento: number;
}

export interface CobroConceptoDetalle {
  id?: number;
  id_concepto?: number;
  descripcion: string;
  tipo?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  observacion?: string;
}

export interface ResumenCobro {
  id_cobro?: number;
  id_incidente: number;
  id_asignacion?: number;
  estado_pago?: string;
  subtotal: number;
  descuento: number;
  total: number;
  fecha_generacion?: string;
  fecha_aceptacion?: string;
  fecha_pago?: string;
  fecha_comprobante?: string;
  conceptos?: CobroConceptoDetalle[];
}

export interface ComprobantePago {
  id_comprobante?: number;
  id_cobro?: number;
  numero_comprobante?: string;
  fecha_emision?: string;
  total?: number;
  detalle?: ResumenCobro;
}

@Injectable({ providedIn: 'root' })
export class PagoService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listarConceptos(): Observable<ConceptoCobro[]> {
    return this.http.get<ConceptoCobro[]>(`${this.apiUrl}/pagos/conceptos-cobro`);
  }

  registrarConceptos(
    idIncidente: number,
    token: string,
    datos: RegistrarConceptosCobroPayload
  ): Observable<ResumenCobro> {
    return this.http.post<ResumenCobro>(
      `${this.apiUrl}/pagos/incidentes/${idIncidente}/conceptos-cobro`,
      datos,
      { params: { token } }
    );
  }

  obtenerResumen(idIncidente: number, token: string): Observable<ResumenCobro> {
    return this.http.get<ResumenCobro>(
      `${this.apiUrl}/pagos/incidentes/${idIncidente}/resumen`,
      { params: { token } }
    );
  }

  obtenerComprobante(idIncidente: number, token: string): Observable<ComprobantePago> {
    return this.http.get<ComprobantePago>(
      `${this.apiUrl}/pagos/incidentes/${idIncidente}/comprobante`,
      { params: { token } }
    );
  }
}
