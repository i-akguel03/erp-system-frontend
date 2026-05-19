import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api-service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from '../auth/services/auth';

@Injectable({ providedIn: 'root' })
export class InitService extends BaseApiService {
  private base = `${this.apiBaseUrl}/api/init`;

  constructor(http: HttpClient, authService: AuthService) {
    super(http, authService);
  }

  initFull(password: string): Observable<string> {
    const params = new HttpParams().set('password', password);
    return this.http.post(`${this.base}/full`, {}, { headers: this.getAuthHeaders(), params, responseType: 'text' });
  }

  initFullWithBilling(billingDate: string, password: string): Observable<string> {
    const params = new HttpParams().set('billingDate', billingDate).set('password', password);
    return this.http.post(`${this.base}/full-with-billing`, {}, { headers: this.getAuthHeaders(), params, responseType: 'text' });
  }

  initBasic(password: string): Observable<string> {
    const params = new HttpParams().set('password', password);
    return this.http.post(`${this.base}/basic`, {}, { headers: this.getAuthHeaders(), params, responseType: 'text' });
  }

  initRealistic(password: string): Observable<string> {
    const params = new HttpParams().set('password', password);
    return this.http.post(`${this.base}/realistic`, {}, { headers: this.getAuthHeaders(), params, responseType: 'text' });
  }

  initDevelopment(password: string): Observable<string> {
    const params = new HttpParams().set('password', password);
    return this.http.post(`${this.base}/development`, {}, { headers: this.getAuthHeaders(), params, responseType: 'text' });
  }

  initDemo(password: string): Observable<string> {
    const params = new HttpParams().set('password', password);
    return this.http.post(`${this.base}/demo`, {}, { headers: this.getAuthHeaders(), params, responseType: 'text' });
  }

  clearAll(password: string): Observable<string> {
    const params = new HttpParams().set('password', password);
    return this.http.delete(`${this.base}/clear`, { headers: this.getAuthHeaders(), params, responseType: 'text' });
  }

  clearBusiness(password: string): Observable<string> {
    const params = new HttpParams().set('password', password);
    return this.http.delete(`${this.base}/clear-business`, { headers: this.getAuthHeaders(), params, responseType: 'text' });
  }

  status(password: string): Observable<string> {
    const params = new HttpParams().set('password', password);
    return this.http.get(`${this.base}/status`, { headers: this.getAuthHeaders(), params, responseType: 'text' });
  }

  repair(password: string): Observable<string> {
    const params = new HttpParams().set('password', password);
    return this.http.post(`${this.base}/repair`, {}, { headers: this.getAuthHeaders(), params, responseType: 'text' });
  }

  maintenance(password: string): Observable<string> {
    const params = new HttpParams().set('password', password);
    return this.http.post(`${this.base}/maintenance`, {}, { headers: this.getAuthHeaders(), params, responseType: 'text' });
  }
}
