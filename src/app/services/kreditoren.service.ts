import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api-service';
import { Lieferant } from '../models/Lieferant';
import { Eingangsrechnung, EingangsrechnungErfassenRequest, ZahlungRequest } from '../models/Eingangsrechnung';

@Injectable({ providedIn: 'root' })
export class KreditorenService extends BaseApiService {
  private apiUrl = `${this.apiBaseUrl}/api/kreditoren`;

  // --- Lieferanten ---
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
