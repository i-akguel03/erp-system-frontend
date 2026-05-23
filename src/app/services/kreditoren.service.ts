import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from './base-api-service';
import { Lieferant } from '../models/Lieferant';
import { Eingangsrechnung, EingangsrechnungErfassenRequest, ZahlungRequest } from '../models/Eingangsrechnung';
import { PagedResult } from '../models/PagedResult';

@Injectable({ providedIn: 'root' })
export class KreditorenService extends BaseApiService {
  private apiUrl = `${this.apiBaseUrl}/api/kreditoren`;

  // --- Lieferanten ---
  getLieferantenPaginated(page = 0, size = 20): Observable<PagedResult<Lieferant>> {
    const params = { paginated: 'true', page: page.toString(), size: size.toString() };
    return this.http.get<Lieferant[]>(`${this.apiUrl}/lieferanten`, { headers: this.getAuthHeaders(), params, observe: 'response' }).pipe(
      map(res => ({
        content: res.body ?? [],
        totalElements: Number(res.headers.get('X-Total-Count') ?? 0),
        totalPages: Number(res.headers.get('X-Total-Pages') ?? 1),
        currentPage: Number(res.headers.get('X-Current-Page') ?? 0)
      }))
    );
  }

  getAllLieferanten(): Observable<Lieferant[]> {
    return this.http.get<Lieferant[]>(`${this.apiUrl}/lieferanten`, { headers: this.getAuthHeaders() });
  }

  getLieferantById(id: string): Observable<Lieferant> {
    return this.http.get<Lieferant>(`${this.apiUrl}/lieferanten/${id}`, { headers: this.getAuthHeaders() });
  }

  createLieferant(lieferant: Partial<Lieferant>): Observable<Lieferant> {
    return this.http.post<Lieferant>(`${this.apiUrl}/lieferanten`, lieferant, { headers: this.getAuthHeaders() });
  }

  updateLieferant(id: string, lieferant: Partial<Lieferant>): Observable<Lieferant> {
    return this.http.put<Lieferant>(`${this.apiUrl}/lieferanten/${id}`, lieferant, { headers: this.getAuthHeaders() });
  }

  // --- Eingangsrechnungen ---
  getEingangsrechnungenPaginated(page = 0, size = 20): Observable<PagedResult<Eingangsrechnung>> {
    const params = { paginated: 'true', page: page.toString(), size: size.toString() };
    return this.http.get<Eingangsrechnung[]>(`${this.apiUrl}/eingangsrechnungen`, { headers: this.getAuthHeaders(), params, observe: 'response' }).pipe(
      map(res => ({
        content: res.body ?? [],
        totalElements: Number(res.headers.get('X-Total-Count') ?? 0),
        totalPages: Number(res.headers.get('X-Total-Pages') ?? 1),
        currentPage: Number(res.headers.get('X-Current-Page') ?? 0)
      }))
    );
  }

  getAllEingangsrechnungen(): Observable<Eingangsrechnung[]> {
    return this.http.get<Eingangsrechnung[]>(`${this.apiUrl}/eingangsrechnungen`, { headers: this.getAuthHeaders() });
  }

  getEingangsrechnungById(id: string): Observable<Eingangsrechnung> {
    return this.http.get<Eingangsrechnung>(`${this.apiUrl}/eingangsrechnungen/${id}`, { headers: this.getAuthHeaders() });
  }

  getUeberfaellige(): Observable<Eingangsrechnung[]> {
    return this.http.get<Eingangsrechnung[]>(`${this.apiUrl}/eingangsrechnungen/ueberfaellig`, { headers: this.getAuthHeaders() });
  }

  erfassen(request: EingangsrechnungErfassenRequest): Observable<Eingangsrechnung> {
    return this.http.post<Eingangsrechnung>(`${this.apiUrl}/eingangsrechnungen`, request, { headers: this.getAuthHeaders() });
  }

  freigeben(id: string): Observable<Eingangsrechnung> {
    return this.http.post<Eingangsrechnung>(`${this.apiUrl}/eingangsrechnungen/${id}/freigeben`, {}, { headers: this.getAuthHeaders() });
  }

  bezahlen(id: string, request: ZahlungRequest): Observable<Eingangsrechnung> {
    return this.http.post<Eingangsrechnung>(`${this.apiUrl}/eingangsrechnungen/${id}/bezahlen`, request, { headers: this.getAuthHeaders() });
  }
}
