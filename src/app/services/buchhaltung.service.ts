import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api-service';
import { Buchungssatz } from '../models/Buchungssatz';

@Injectable({ providedIn: 'root' })
export class BuchhaltungService extends BaseApiService {
  private apiUrl = `${this.apiBaseUrl}/api/buchhaltung`;

  getAllBuchungen(): Observable<Buchungssatz[]> {
    return this.http.get<Buchungssatz[]>(`${this.apiUrl}/buchungen`, { headers: this.getAuthHeaders() });
  }

  getBuchungById(id: string): Observable<Buchungssatz> {
    return this.http.get<Buchungssatz>(`${this.apiUrl}/buchungen/${id}`, { headers: this.getAuthHeaders() });
  }

  getKontoSaldo(kontonummer: number, jahr: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/konten/${kontonummer}/saldo`, {
      headers: this.getAuthHeaders(),
      params: { jahr: jahr.toString() }
    });
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
