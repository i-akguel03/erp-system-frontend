import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api-service';

@Injectable({ providedIn: 'root' })
export class AdminSettingsService extends BaseApiService {
  private baseUrl = `${this.apiBaseUrl}/api/admin/settings`;

  getAuditExcluded(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/audit/excluded`, { headers: this.getAuthHeaders() });
  }

  excludeEntityType(entityType: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/audit/excluded/${entityType}`, null, { headers: this.getAuthHeaders() });
  }

  includeEntityType(entityType: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/audit/excluded/${entityType}`, { headers: this.getAuthHeaders() });
  }
}
