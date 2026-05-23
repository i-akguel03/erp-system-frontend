import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BaseApiService } from './base-api-service';
import { DueSchedule } from '../models/DueSchedule';
import { PagedResult } from '../models/PagedResult';

@Injectable({
  providedIn: 'root',
})
export class DueScheduleService extends BaseApiService {
  private apiUrl = `${this.apiBaseUrl}/api/due-schedules`;

  // --- Mapper ---
  private mapToDueSchedule(dto: any): DueSchedule {
    return {
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate).toISOString().split('T')[0] : null,
      periodStart: dto.periodStart ? new Date(dto.periodStart).toISOString().split('T')[0] : null,
      periodEnd: dto.periodEnd ? new Date(dto.periodEnd).toISOString().split('T')[0] : null,
      overdue: dto.overdue || false,
    } as DueSchedule;
  }

  // --- CRUD ---
  getDueSchedulesPaginated(page = 0, size = 20): Observable<PagedResult<DueSchedule>> {
    const params = { paginated: 'true', page: page.toString(), size: size.toString() };
    return this.http.get<any[]>(this.apiUrl, { headers: this.getAuthHeaders(), params, observe: 'response' }).pipe(
      map(res => ({
        content: (res.body ?? []).map((dto: any) => this.mapToDueSchedule(dto)),
        totalElements: Number(res.headers.get('X-Total-Count') ?? 0),
        totalPages: Number(res.headers.get('X-Total-Pages') ?? 1),
        currentPage: Number(res.headers.get('X-Current-Page') ?? 0)
      }))
    );
  }

  getAllDueSchedules(): Observable<DueSchedule[]> {
    return this.http.get<any>(this.apiUrl, { headers: this.getAuthHeaders() })
      .pipe(map(res => (res.content || res).map((dto: any) => this.mapToDueSchedule(dto))));
  }

  getDueScheduleById(id: string): Observable<DueSchedule> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToDueSchedule(dto)));
  }

  createDueSchedule(schedule: Partial<DueSchedule>): Observable<DueSchedule> {
    return this.http.post<any>(this.apiUrl, schedule, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToDueSchedule(dto)));
  }

  updateDueSchedule(id: string, schedule: Partial<DueSchedule>): Observable<DueSchedule> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, schedule, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToDueSchedule(dto)));
  }

  deleteDueSchedule(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

// --- Spezielle Endpunkte ---
getDueSchedulesBySubscription(subscriptionId: string): Observable<DueSchedule[]> {
  return this.http.get<DueSchedule[]>(`${this.apiUrl}/subscription/${subscriptionId}`, { headers: this.getAuthHeaders() })
    .pipe(map(res => res.map(dto => this.mapToDueSchedule(dto))));
}

getOverdueDueSchedules(): Observable<DueSchedule[]> {
  return this.http.get<DueSchedule[]>(`${this.apiUrl}/overdue`, { headers: this.getAuthHeaders() })
    .pipe(map(res => res.map(dto => this.mapToDueSchedule(dto))));
}

getDueTodaySchedules(): Observable<DueSchedule[]> {
  return this.http.get<DueSchedule[]>(`${this.apiUrl}/due-today`, { headers: this.getAuthHeaders() })
    .pipe(map(res => res.map(dto => this.mapToDueSchedule(dto))));
}

generateDueSchedulesForSubscription(subscriptionId: string, months: number): Observable<DueSchedule[]> {
  return this.http.post<DueSchedule[]>(`${this.apiUrl}/subscription/${subscriptionId}/generate?months=${months}`, {}, { headers: this.getAuthHeaders() })
    .pipe(map(res => res.map(dto => this.mapToDueSchedule(dto))));
}

}
