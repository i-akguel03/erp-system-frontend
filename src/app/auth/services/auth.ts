// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, timer, of } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  private baseUrl = environment.apiBaseUrl;
  private apiUrl = `${this.baseUrl}/auth`;
  private readonly ACCESS_TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';

  // BehaviorSubjects für reaktive Token-Updates
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);
  private isRefreshing = false;

  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) { 
    this.loadTokensFromStorage();
    this.startTokenRefreshTimer();
  }

  // Tokens aus localStorage laden beim Service-Start
  private loadTokensFromStorage(): void {
    const accessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    
    if (accessToken) this.tokenSubject.next(accessToken);
    if (refreshToken) this.refreshTokenSubject.next(refreshToken);
  }

  // Login Request
  login(data: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap((response) => {
        if (response.accessToken && response.refreshToken) {
          this.saveTokens(response);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Login fehlgeschlagen:', error);
        throw error;
      })
    );
  }

  // Register Request
  register(data: AuthRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/register`, data, { responseType: 'text' });
  }

  // Tokens speichern (privat, wird nur intern verwendet)
  saveTokens(tokens: AuthResponse): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    
    this.tokenSubject.next(tokens.accessToken);
    this.refreshTokenSubject.next(tokens.refreshToken);
    
    console.log('Tokens erfolgreich gespeichert');
  }

  // Access Token abrufen
  getAccessToken(): string | null {
    return this.tokenSubject.value || localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  // Refresh Token abrufen
  getRefreshToken(): string | null {
    return this.refreshTokenSubject.value || localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  // Token Refresh mit verbesserter Fehlerbehandlung
  refreshToken(): Observable<AuthResponse | null> {
    if (this.isRefreshing) {
      // Warte auf bereits laufenden Refresh
      return this.token$.pipe(
        switchMap(token => token ? of({ accessToken: token, refreshToken: this.getRefreshToken()! }) : of(null))
      );
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      console.warn('Kein Refresh Token verfügbar');
      this.logout();
      return of(null);
    }

    this.isRefreshing = true;

    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, {
      refreshToken: refreshToken
    }).pipe(
      tap((response) => {
        if (response.accessToken && response.refreshToken) {
          this.saveTokens(response);
        }
        this.isRefreshing = false;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Token refresh fehlgeschlagen:', error);
        this.isRefreshing = false;
        this.logout(); // Bei Refresh-Fehler ausloggen
        return of(null);
      })
    );
  }

  // Automatischer Token-Refresh Timer
  private startTokenRefreshTimer(): void {
    // Prüfe alle 2 Minuten, ob Token erneuert werden muss
    timer(0, 2 * 60 * 1000).pipe(
      switchMap(() => {
        if (this.shouldRefreshToken() && !this.isRefreshing) {
          console.log('Token wird automatisch erneuert...');
          return this.refreshToken();
        }
        return of(null);
      })
    ).subscribe({
      next: (result) => {
        if (result) {
          console.log('Token automatisch erneuert');
        }
      },
      error: (error) => {
        console.error('Automatischer Token-Refresh fehlgeschlagen:', error);
      }
    });
  }

  // Prüfen ob Token erneuert werden sollte
  private shouldRefreshToken(): boolean {
    const token = this.getAccessToken();
    if (!token || !this.isAuthenticated()) {
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - now;
      
      // Refresh wenn weniger als 3 Minuten bis Ablauf (bei 15min Gültigkeit)
      return timeUntilExpiry < 180;
    } catch {
      return false;
    }
  }

  // Logout mit verbesserter Cleanup
  logout(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    this.tokenSubject.next(null);
    this.refreshTokenSubject.next(null);
    this.isRefreshing = false;
    console.log('Logout erfolgreich - Alle Tokens entfernt');
  }

  // Alternative: Alle Tokens löschen (Alias für logout)
  clearTokens(): void {
    this.logout();
  }

  // Prüfen ob User authentifiziert ist
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) {
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Fehler beim Token-Check:', error);
      return false;
    }
  }

  // Username aus Token extrahieren
  getCurrentUser(): string | null {
    try {
      const token = this.getAccessToken();
      if (!token) {
        return null;
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.username || payload.user || null;
    } catch (error) {
      console.error('Fehler beim Extrahieren des Usernames:', error);
      return null;
    }
  }

  // Authorization Header für HTTP Requests
  getAuthorizationHeader(): string | null {
    const token = this.getAccessToken();
    return token ? `Bearer ${token}` : null;
  }

  // Token-Gültigkeitsdauer abrufen
  getTokenExpirationTime(): Date | null {
    try {
      const token = this.getAccessToken();
      if (!token) {
        return null;
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch (error) {
      console.error('Fehler beim Abrufen der Token-Ablaufzeit:', error);
      return null;
    }
  }

  // Prüfen ob Token bald abläuft
  isTokenExpiringSoon(minutesThreshold: number = 5): boolean {
    const expirationTime = this.getTokenExpirationTime();
    if (!expirationTime) {
      return false;
    }

    const now = new Date();
    const threshold = new Date(now.getTime() + (minutesThreshold * 60 * 1000));
    
    return expirationTime <= threshold;
  }

  // Backend Logout (falls Backend einen Logout-Endpoint hat)
  logoutFromBackend(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return of(null);
    }

    return this.http.post(`${this.apiUrl}/logout`, {
      refreshToken: refreshToken
    }).pipe(
      catchError((error) => {
        console.warn('Backend-Logout fehlgeschlagen:', error);
        return of(null);
      })
    );
  }

  // Vollständiger Logout mit Backend-Call
  logoutComplete(): Observable<any> {
    return new Observable(observer => {
      this.logoutFromBackend().subscribe({
        next: (response) => {
          this.logout();
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          this.logout();
          console.warn('Backend-Logout fehlgeschlagen, lokale Tokens trotzdem entfernt:', error);
          observer.next(null);
          observer.complete();
        }
      });
    });
  }

  // Debug-Funktion: Token-Info anzeigen
  getTokenInfo(): any {
    try {
      const token = this.getAccessToken();
      if (!token) {
        return null;
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      
      return {
        username: payload.sub || payload.username,
        roles: payload.roles || [],
        issuedAt: new Date(payload.iat * 1000),
        expiresAt: new Date(payload.exp * 1000),
        isExpired: payload.exp <= now,
        timeUntilExpiry: (payload.exp - now) * 1000,
        shouldRefresh: this.shouldRefreshToken()
      };
    } catch (error) {
      console.error('Fehler beim Abrufen der Token-Info:', error);
      return null;
    }
  }

  // Hilfsmethode für manuelle Token-Erneuerung (für Debugging)
  forceTokenRefresh(): Observable<AuthResponse | null> {
    console.log('Manuelle Token-Erneuerung ausgelöst');
    return this.refreshToken();
  }
}