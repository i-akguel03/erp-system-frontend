import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api-service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from '../auth/services/auth';

@Injectable({ providedIn: 'root' })
export class InitService extends BaseApiService {
  private base = `${this.apiBaseUrl}/init`;

  constructor(http: HttpClient, authService: AuthService) {
    super(http, authService);
  }

  initFull(): Observable<string> {
    return this.http.post(`${this.base}/full`, {}, { headers: this.getAuthHeaders(), responseType: 'text' });
  }

  initFullWithBilling(billingDate: string): Observable<string> {
    const params = new HttpParams().set('billingDate', billingDate);
    return this.http.post(`${this.base}/full-with-billing`, {}, { headers: this.getAuthHeaders(), params, responseType: 'text' });
  }

  initBasic(): Observable<string> {
    return this.http.post(`${this.base}/basic`, {}, { headers: this.getAuthHeaders(), responseType: 'text' });
  }

  initRealistic(): Observable<string> {
    return this.http.post(`${this.base}/realistic`, {}, { headers: this.getAuthHeaders(), responseType: 'text' });
  }

  initDevelopment(): Observable<string> {
    return this.http.post(`${this.base}/development`, {}, { headers: this.getAuthHeaders(), responseType: 'text' });
  }

  initDemo(): Observable<string> {
    return this.http.post(`${this.base}/demo`, {}, { headers: this.getAuthHeaders(), responseType: 'text' });
  }

  clearAll(password: string): Observable<string> {
    const params = new HttpParams().set('password', password);
    return this.http.delete(`${this.base}/clear`, { headers: this.getAuthHeaders(), params, responseType: 'text' });
  }

  clearBusiness(password: string): Observable<string> {
    const params = new HttpParams().set('password', password);
    return this.http.delete(`${this.base}/clear-business`, { headers: this.getAuthHeaders(), params, responseType: 'text' });
  }

  status(): Observable<string> {
    return this.http.get(`${this.base}/status`, { headers: this.getAuthHeaders(), responseType: 'text' });
  }

  repair(): Observable<string> {
    return this.http.post(`${this.base}/repair`, {}, { headers: this.getAuthHeaders(), responseType: 'text' });
  }

  maintenance(): Observable<string> {
    return this.http.post(`${this.base}/maintenance`, {}, { headers: this.getAuthHeaders(), responseType: 'text' });
  }
}
