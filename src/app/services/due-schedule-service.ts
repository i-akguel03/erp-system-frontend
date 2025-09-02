import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BaseApiService } from './base-api-service';
import { DueSchedule, DueScheduleStatistics, PaymentDto } from '../models/DueSchedule';

@Injectable({
  providedIn: 'root',
})
export class DueScheduleService extends BaseApiService {
  private apiUrl = `${this.apiBaseUrl}/api/due-schedules`;

  // --- Mapper ---
  private mapToDueSchedule(dto: any): DueSchedule {
    return {
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      paidDate: dto.paidDate ? new Date(dto.paidDate) : null,
      amount: dto.amount != null ? Number(dto.amount) : 0
    } as DueSchedule;
  }

  // --- CRUD ---
getAllDueSchedules(): Observable<DueSchedule[]> {
  return this.http.get<any>(this.apiUrl, { headers: this.getAuthHeaders() })
    .pipe(
      map(res => (res.content || res).map((dto: any) => this.mapToDueSchedule(dto)))
    );
}
  getDueScheduleById(id: string): Observable<DueSchedule> {
    return this.http.get<DueSchedule>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToDueSchedule(dto)));
  }

  createDueSchedule(dueSchedule: DueSchedule): Observable<DueSchedule> {
    return this.http.post<DueSchedule>(this.apiUrl, dueSchedule, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToDueSchedule(dto)));
  }

  updateDueSchedule(id: string, dueSchedule: DueSchedule): Observable<DueSchedule> {
    return this.http.put<DueSchedule>(`${this.apiUrl}/${id}`, dueSchedule, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToDueSchedule(dto)));
  }

  deleteDueSchedule(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  // --- Subscription Queries ---
  getDueSchedulesBySubscription(subscriptionId: string): Observable<DueSchedule[]> {
    return this.http.get<DueSchedule[]>(`${this.apiUrl}/subscription/${subscriptionId}`, { headers: this.getAuthHeaders() })
      .pipe(map(arr => arr.map(dto => this.mapToDueSchedule(dto))));
  }

  getNextDueScheduleBySubscription(subscriptionId: string): Observable<DueSchedule> {
    return this.http.get<DueSchedule>(`${this.apiUrl}/subscription/${subscriptionId}/next-due`, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToDueSchedule(dto)));
  }

  // --- Status & Filtering ---
  getDueSchedulesByStatus(status: string): Observable<DueSchedule[]> {
    return this.http.get<DueSchedule[]>(`${this.apiUrl}/status/${status}`, { headers: this.getAuthHeaders() })
      .pipe(map(arr => arr.map(dto => this.mapToDueSchedule(dto))));
  }

  getOverdueDueSchedules(): Observable<DueSchedule[]> {
    return this.http.get<DueSchedule[]>(`${this.apiUrl}/overdue`, { headers: this.getAuthHeaders() })
      .pipe(map(arr => arr.map(dto => this.mapToDueSchedule(dto))));
  }

  getUpcomingDueSchedules(days: number = 7): Observable<DueSchedule[]> {
    return this.http.get<DueSchedule[]>(`${this.apiUrl}/upcoming`, { headers: this.getAuthHeaders(), params: { days: days.toString() } })
      .pipe(map(arr => arr.map(dto => this.mapToDueSchedule(dto))));
  }

  // --- Payments ---
  recordPayment(id: string, payment: PaymentDto): Observable<DueSchedule> {
    return this.http.post<DueSchedule>(`${this.apiUrl}/${id}/payment`, payment, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToDueSchedule(dto)));
  }

  markAsPaid(id: string): Observable<DueSchedule> {
    return this.http.put<DueSchedule>(`${this.apiUrl}/${id}/mark-paid`, {}, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToDueSchedule(dto)));
  }

  cancelDueSchedule(id: string): Observable<DueSchedule> {
    return this.http.put<DueSchedule>(`${this.apiUrl}/${id}/cancel`, {}, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToDueSchedule(dto)));
  }

  sendReminder(id: string): Observable<DueSchedule> {
    return this.http.post<DueSchedule>(`${this.apiUrl}/${id}/send-reminder`, {}, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToDueSchedule(dto)));
  }

  // --- Statistics / Dashboard ---
  getDueScheduleStatistics(): Observable<DueScheduleStatistics> {
    return this.http.get<DueScheduleStatistics>(`${this.apiUrl}/statistics`, { headers: this.getAuthHeaders() });
  }

  getTotalPendingAmount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/sum/pending`, { headers: this.getAuthHeaders() });
  }

  getTotalPaidAmount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/sum/paid`, { headers: this.getAuthHeaders() });
  }

  getTotalOverdueAmount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/sum/overdue`, { headers: this.getAuthHeaders() });
  }

  // --- Generate / Processes ---
  generateDueSchedulesForSubscription(subscriptionId: string, months: number): Observable<DueSchedule[]> {
    return this.http.post<DueSchedule[]>(`${this.apiUrl}/subscription/${subscriptionId}/generate`, {}, {
      headers: this.getAuthHeaders(),
      params: { months: months.toString() }
    }).pipe(map(arr => arr.map(dto => this.mapToDueSchedule(dto))));
  }
}
