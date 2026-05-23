import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from './base-api-service';
import { Buchungssatz } from '../models/Buchungssatz';
import { PagedResult } from '../models/PagedResult';

@Injectable({ providedIn: 'root' })
export class BuchhaltungService extends BaseApiService {
  private apiUrl = `${this.apiBaseUrl}/api/buchhaltung`;

  getBuchungenPaginated(page = 0, size = 20): Observable<PagedResult<Buchungssatz>> {
    const params = { paginated: 'true', page: page.toString(), size: size.toString() };
    return this.http.get<Buchungssatz[]>(`${this.apiUrl}/buchungen`, { headers: this.getAuthHeaders(), params, observe: 'response' }).pipe(
      map(res => ({
        content: res.body ?? [],
        totalElements: Number(res.headers.get('X-Total-Count') ?? 0),
        totalPages: Number(res.headers.get('X-Total-Pages') ?? 1),
        currentPage: Number(res.headers.get('X-Current-Page') ?? 0)
      }))
    );
  }

  getAllBuchungen(): Observable<Buchungssatz[]> {
    return this.http.get<Buchungssatz[]>(`${this.apiUrl}/buchungen`, { headers: this.getAuthHeaders() });
  }

  getBuchungById(id: string): Observable<Buchungssatz> {
    return this.http.get<Buchungssatz>(`${this.apiUrl}/buchungen/${id}`, { headers: this.getAuthHeaders() });
  }

  getGuvUebersicht(jahr: number): Observable<{ [bezeichnung: string]: number }> {
    return this.http.get<{ [bezeichnung: string]: number }>(`${this.apiUrl}/berichte/guv`, {
      headers: this.getAuthHeaders(),
      params: { jahr: jahr.toString() }
    });
  }

  stornieren(buchungssatzId: string): Observable<Buchungssatz> {
    return this.http.post<Buchungssatz>(`${this.apiUrl}/buchungen/${buchungssatzId}/stornieren`, {}, { headers: this.getAuthHeaders() });
  }
}
