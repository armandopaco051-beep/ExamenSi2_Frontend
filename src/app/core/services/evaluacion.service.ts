import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroments';

export interface EvaluacionServicio {
  id: number;
  id_incidente: number;
  id_asignacion: number;
  codigo_cliente: string;
  codigo_tecnico: string;
  id_taller: number;
  calificacion: number;
  puntualidad: number;
  trato: number;
  solucion: number;
  precio: number;
  comentario?: string;
  fecha_evaluacion: string;
}

export interface ResumenEvaluacionTecnico {
  codigo_tecnico: string;
  total_evaluaciones: number;
  promedio_calificacion: number;
  ultimas_evaluaciones: EvaluacionServicio[];
}

export interface ResumenEvaluacionTaller {
  id_taller: number;
  total_evaluaciones: number;
  promedio_calificacion: number;
  evaluaciones: EvaluacionServicio[];
}

@Injectable({ providedIn: 'root' })
export class EvaluacionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  obtenerResumenTecnico(codigoTecnico: string, token: string): Observable<ResumenEvaluacionTecnico> {
    return this.http.get<ResumenEvaluacionTecnico>(
      `${this.apiUrl}/evaluaciones/tecnico/${codigoTecnico}/resumen`,
      { params: { token } }
    );
  }

  obtenerEvaluacionesTaller(idTaller: number, token: string): Observable<ResumenEvaluacionTaller> {
    return this.http.get<ResumenEvaluacionTaller>(
      `${this.apiUrl}/evaluaciones/taller/${idTaller}`,
      { params: { token } }
    );
  }
}
