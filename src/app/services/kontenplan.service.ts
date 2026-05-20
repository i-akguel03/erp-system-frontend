import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api-service';
import { Konto } from '../models/Konto';

@Injectable({ providedIn: 'root' })
export class KontenplanService extends BaseApiService {
  private apiUrl = `${this.apiBaseUrl}/api/konten`;

  getAll(): Observable<Konto[]> {
    return this.http.get<Konto[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  getByNummer(kontonummer: number): Observable<Konto> {
    return this.http.get<Konto>(`${this.apiUrl}/${kontonummer}`, { headers: this.getAuthHeaders() });
  }

  initSkr04(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/init-skr04`, {}, { headers: this.getAuthHeaders() });
  }

  create(konto: Partial<Konto>): Observable<Konto> {
    return this.http.post<Konto>(this.apiUrl, konto, { headers: this.getAuthHeaders() });
  }
}
