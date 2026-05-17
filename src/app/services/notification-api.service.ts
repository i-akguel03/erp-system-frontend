import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AuthService } from '../auth/services/auth';
import { BaseApiService } from './base-api-service';
import { AppNotification } from '../models/Notification';

export interface NotificationPage {
  items: AppNotification[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationApiService extends BaseApiService {
  private apiUrl = `${this.apiBaseUrl}/api/notifications`;

  constructor(http: HttpClient, authService: AuthService) {
    super(http, authService);
  }

  getNotifications(page = 0, size = 20): Observable<NotificationPage> {
    return this.http.get<AppNotification[]>(
      `${this.apiUrl}?page=${page}&size=${size}`,
      { headers: this.getAuthHeaders(), observe: 'response' }
    ).pipe(
      map(res => ({
        items: res.body ?? [],
        totalElements: Number(res.headers.get('X-Total-Count') ?? 0),
        totalPages: Number(res.headers.get('X-Total-Pages') ?? 1),
        currentPage: Number(res.headers.get('X-Current-Page') ?? 0)
      }))
    );
  }

  countUnread(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/unread/count`, { headers: this.getAuthHeaders() });
  }

  markAsRead(id: string): Observable<AppNotification> {
    return this.http.put<AppNotification>(`${this.apiUrl}/${id}/read`, {}, { headers: this.getAuthHeaders() });
  }

  markAllRead(): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/read-all`, {}, { headers: this.getAuthHeaders() });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}
