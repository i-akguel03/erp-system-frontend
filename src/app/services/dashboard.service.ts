import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/services/auth';
import { BaseApiService } from './base-api-service';
import {
  DashboardKpiDto,
  MonthlyRevenueDto,
  OpenItemsOverviewDto,
  OutstandingPaymentsDto
} from '../models/Dashboard';

@Injectable({ providedIn: 'root' })
export class DashboardService extends BaseApiService {
  private apiUrl = `${this.apiBaseUrl}/api/dashboard`;

  constructor(http: HttpClient, authService: AuthService) {
    super(http, authService);
  }

  getKpi(): Observable<DashboardKpiDto> {
    return this.http.get<DashboardKpiDto>(`${this.apiUrl}/kpi`, { headers: this.getAuthHeaders() });
  }

  getMonthlyRevenue(year: number): Observable<MonthlyRevenueDto[]> {
    return this.http.get<MonthlyRevenueDto[]>(
      `${this.apiUrl}/revenue/monthly?year=${year}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getOpenItemsOverview(): Observable<OpenItemsOverviewDto> {
    return this.http.get<OpenItemsOverviewDto>(`${this.apiUrl}/open-items`, { headers: this.getAuthHeaders() });
  }

  getOutstandingPayments(): Observable<OutstandingPaymentsDto> {
    return this.http.get<OutstandingPaymentsDto>(`${this.apiUrl}/payments/outstanding`, { headers: this.getAuthHeaders() });
  }
}
