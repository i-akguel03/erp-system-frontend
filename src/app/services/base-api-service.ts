import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '../auth/services/auth';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BaseApiService {
  protected apiBaseUrl = environment.apiBaseUrl;

  constructor(protected http: HttpClient, protected authService: AuthService) {}

  protected getAuthHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();
    return token
      ? new HttpHeaders({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        })
      : new HttpHeaders({
          'Content-Type': 'application/json',
          Accept: 'application/json',
        });
  }
}
