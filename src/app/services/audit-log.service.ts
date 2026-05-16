import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/services/auth';
import { BaseApiService } from './base-api-service';
import { AuditLog, AuditPage, AuditAction } from '../models/AuditLog';

@Injectable({ providedIn: 'root' })
export class AuditLogService extends BaseApiService {
  private apiUrl = `${this.apiBaseUrl}/api/audit-logs`;

  constructor(http: HttpClient, authService: AuthService) {
    super(http, authService);
  }

  getAll(page = 0, size = 50): Observable<AuditPage> {
    return this.http.get<AuditPage>(
      `${this.apiUrl}?page=${page}&size=${size}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getByUser(username: string): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(
      `${this.apiUrl}/user/${encodeURIComponent(username)}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getByAction(action: AuditAction): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(
      `${this.apiUrl}/action/${action}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getByEntityType(entityType: string): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(
      `${this.apiUrl}/entity/${encodeURIComponent(entityType)}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getByDateRange(from: string, to: string): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(
      `${this.apiUrl}/range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { headers: this.getAuthHeaders() }
    );
  }
}
