import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroments';

@Injectable({
  providedIn: 'root'
})
export class EvidenciaService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ✅ CAMBIO: obtiene todas las evidencias de un incidente
  listarPorIncidente(idIncidente: number): Observable<any[]> {
    return this.http.get<any>(
      `${this.apiUrl}/evidencias/${idIncidente}`
    ).pipe(
      map(response => this.extraerEvidencias(response))
    );
  }

  private extraerEvidencias(response: any): any[] {
    const encontradas = this.buscarEvidencias(response);
    if (encontradas.length > 0) return this.deduplicarEvidencias(encontradas);

    if (Array.isArray(response)) return response;

    const listas = [
      response?.evidencias,
      response?.data,
      response?.items,
      response?.imagenes,
      response?.images,
      response?.fotos,
      response?.fotografias,
      response?.archivos,
      response?.files,
      response?.multimedia
    ].filter(Array.isArray);

    if (listas.length === 0) return [];

    return this.deduplicarEvidencias(listas.flat());
  }

  private buscarEvidencias(valor: any, visitados = new Set<any>()): any[] {
    if (!valor || typeof valor !== 'object' || visitados.has(valor)) return [];
    visitados.add(valor);

    if (Array.isArray(valor)) {
      const evidenciasDirectas = valor.filter(item => this.esObjetoEvidencia(item));
      const evidenciasAnidadas = valor.flatMap(item => this.buscarEvidencias(item, visitados));
      return [...evidenciasDirectas, ...evidenciasAnidadas];
    }

    const evidenciaActual = this.esObjetoEvidencia(valor) ? [valor] : [];
    const evidenciasHijas = Object.values(valor).flatMap(item => this.buscarEvidencias(item, visitados));
    return [...evidenciaActual, ...evidenciasHijas];
  }

  private esObjetoEvidencia(valor: any): boolean {
    if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return false;

    return 'id_tipo_evidencia' in valor ||
      'url_archivo' in valor ||
      'transcripcion' in valor ||
      'fecha_subida' in valor;
  }

  private deduplicarEvidencias(evidencias: any[]): any[] {
    const vistos = new Set<string>();

    return evidencias.filter(ev => {
      const clave = [
        ev?.codigo,
        ev?.url_archivo,
        ev?.id_tipo_evidencia,
        ev?.fecha_subida,
        ev?.transcripcion
      ].filter(Boolean).join('|') || JSON.stringify(ev);

      if (vistos.has(clave)) return false;
      vistos.add(clave);
      return true;
    });
  }
}
