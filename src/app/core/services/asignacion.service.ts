import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../enviroments/enviroments";

@Injectable({
  providedIn: 'root'
})
export class AsignacionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  listarPorTaller(idTaller: number ): Observable<any> {
    return this.http.get(`${this.apiUrl}/asignacion/taller/${idTaller}`);
  }

  aceptarAsignacion(idAsignacion: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/asignacion/${idAsignacion}/aceptar`, {});
  }
  rechazarAsignacion(idAsignacion :number, observacion :string){
     return this.http.put<any>(
    `${this.apiUrl}/asignacion/${idAsignacion}/rechazar`,
    { observacion }
  )
  }
  asignarTecnico(idAsignacion : number , codigoTecnico : string){
    return this.http.put<any>(
      `${this.apiUrl}/asignacion/${idAsignacion}/tecnico/${codigoTecnico}`,
      {codigo_tecnico: codigoTecnico,
        observacion: 'Técnico asignado desde el panel del taller'
      }
    )
  }
  iniciarRuta(idAsignacion:number){
    return this.http.put(`${this.apiUrl}/asignacion/${idAsignacion}/iniciar-ruta`, {});
  }
  finalizarServicio(idAsignacion:number){
    return this.http.put(`${this.apiUrl}/asignacion/${idAsignacion}/finalizar`, {});
  }
  
}