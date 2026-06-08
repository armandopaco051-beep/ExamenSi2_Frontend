import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroments';
import { DashboardAdminResponse, DashboardIncidente, DashboardActividad, DashboardTendencia, DashboardTipoEmergencia, DashboardStats } from '../../models/dashboard.model';
import { DashboardTallerResponse } from '../../models/dashboard_taller.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private api = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getAdmin(): Observable<DashboardAdminResponse> {
    return this.http.get<DashboardAdminResponse>(`${this.api}/admin-plataforma`);
  }

  getTaller(id: number): Observable<DashboardTallerResponse> {
    return this.http.get<DashboardTallerResponse>(`${this.api}/admin-taller/${id}`);
  }

  getMiTaller(): Observable<DashboardTallerResponse> {
    return this.http.get<DashboardTallerResponse>(`${this.api}/mi-taller`);
  }
}
