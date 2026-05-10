// src/app/auth/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, timer, of } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Schnittstelle für Login-Request
 */
export interface AuthRequest {
  username: string;
  password: string;
}

/**
 * Schnittstelle für Login-Response
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root' // Service wird global verfügbar gemacht
})
export class AuthService {

  // Basis-URLs aus environment
  private baseUrl = environment.apiBaseUrl;
  private apiUrl = `${this.baseUrl}/auth`;

  // Keys für localStorage
  private readonly ACCESS_TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';

  /**
   * BehaviorSubjects sind Observables, die einen aktuellen Wert halten.
   * Wir nutzen sie, um Token und Auth-Status reaktiv zu verwalten.
   */
  private tokenSubject = new BehaviorSubject<string | null>(null);           // Access Token
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);    // Refresh Token
  private isRefreshing = false;                                              // Flag für laufenden Token-Refresh

  // Auth-Status Observable, z.B. für Navbar oder Guards
  private authStatusSubject = new BehaviorSubject<boolean>(this.isAuthenticated());
  public authStatus$ = this.authStatusSubject.asObservable();

  // Observable für Access Token
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) { 
    this.loadTokensFromStorage();     // Lade Tokens beim Service-Start
    this.startTokenRefreshTimer();    // Start Timer für automatischen Token-Refresh
  }

  /**
   * Lade Tokens aus localStorage beim Start.
   * Wenn Tokens vorhanden, werden sie in die BehaviorSubjects gesetzt.
   */
  private loadTokensFromStorage(): void {
    const accessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);

    if (accessToken) this.tokenSubject.next(accessToken);
    if (refreshToken) this.refreshTokenSubject.next(refreshToken);

    // Auth-Status aktualisieren
    this.authStatusSubject.next(this.isAuthenticated());
  }

  /**
   * Login Request an Backend
   * @param data AuthRequest (username + password)
   */
  login(data: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap((response) => {
        // Wenn Tokens vorhanden, speichere sie und aktualisiere den Auth-Status
        if (response.accessToken && response.refreshToken) {
          this.saveTokens(response);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Login fehlgeschlagen:', error);
        throw error; // Fehler weitergeben
      })
    );
  }

  /**
   * Registrierung eines neuen Nutzers
   */
  register(data: AuthRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/register`, data, { responseType: 'text' });
  }

  /**
   * Speichere Tokens und aktualisiere den Auth-Status
   */
  saveTokens(tokens: AuthResponse): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);

    this.tokenSubject.next(tokens.accessToken);
    this.refreshTokenSubject.next(tokens.refreshToken);

    // Auth-Status auf true setzen → Navbar reagiert sofort
    this.authStatusSubject.next(true);
    console.log('Tokens erfolgreich gespeichert');
  }

  /**
   * Access Token abrufen
   */
  getAccessToken(): string | null {
    return this.tokenSubject.value || localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Refresh Token abrufen
   */
  getRefreshToken(): string | null {
    return this.refreshTokenSubject.value || localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Token Refresh Funktion
   * Prüft, ob schon ein Refresh läuft → sonst neue Anfrage
   */
  refreshToken(): Observable<AuthResponse | null> {
    if (this.isRefreshing) {
      // Wenn schon refresh läuft, auf bestehendes Token warten
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

    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap((response) => {
        if (response.accessToken && response.refreshToken) {
          this.saveTokens(response); // Tokens speichern + Auth-Status setzen
        }
        this.isRefreshing = false;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Token refresh fehlgeschlagen:', error);
        this.isRefreshing = false;
        this.logout(); // Bei Fehler ausloggen
        return of(null);
      })
    );
  }

  /**
   * Automatischer Timer, um Token regelmäßig zu erneuern
   */
  private startTokenRefreshTimer(): void {
    timer(0, 2 * 60 * 1000).pipe( // alle 2 Minuten prüfen
      switchMap(() => {
        if (this.shouldRefreshToken() && !this.isRefreshing) {
          console.log('Token wird automatisch erneuert...');
          return this.refreshToken();
        }
        return of(null);
      })
    ).subscribe({
      next: (result) => {
        if (result) console.log('Token automatisch erneuert');
      },
      error: (error) => console.error('Automatischer Token-Refresh fehlgeschlagen:', error)
    });
  }

  /**
   * Prüfen, ob Token bald abläuft (<3 Minuten)
   */
  private shouldRefreshToken(): boolean {
    const token = this.getAccessToken();
    if (!token || !this.isAuthenticated()) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1])); // JWT Payload
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - now;
      return timeUntilExpiry < 180; // weniger als 3 Minuten
    } catch {
      return false;
    }
  }

  /**
   * Logout → Tokens löschen + Auth-Status setzen
   */
  logout(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    this.tokenSubject.next(null);
    this.refreshTokenSubject.next(null);
    this.authStatusSubject.next(false); // Navbar reagiert sofort
    this.isRefreshing = false;
    console.log('Logout erfolgreich - Alle Tokens entfernt');
  }

  clearTokens(): void {
    this.logout();
  }

  /**
   * Prüfen ob User authentifiziert ist
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Fehler beim Token-Check:', error);
      return false;
    }
  }

  /**
   * Username aus Token extrahieren
   */
  getCurrentUser(): string | null {
    try {
      const token = this.getAccessToken();
      if (!token) return null;

      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.username || payload.user || null;
    } catch (error) {
      console.error('Fehler beim Extrahieren des Usernames:', error);
      return null;
    }
  }

  /**
   * Authorization Header für HTTP Requests
   */
  getAuthorizationHeader(): string | null {
    const token = this.getAccessToken();
    return token ? `Bearer ${token}` : null;
  }

  /**
   * Token-Ablaufzeit als Date abrufen
   */
  getTokenExpirationTime(): Date | null {
    try {
      const token = this.getAccessToken();
      if (!token) return null;

      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch (error) {
      console.error('Fehler beim Abrufen der Token-Ablaufzeit:', error);
      return null;
    }
  }

  /**
   * Prüfen, ob Token bald abläuft
   */
  isTokenExpiringSoon(minutesThreshold: number = 5): boolean {
    const expirationTime = this.getTokenExpirationTime();
    if (!expirationTime) return false;

    const now = new Date();
    const threshold = new Date(now.getTime() + (minutesThreshold * 60 * 1000));
    return expirationTime <= threshold;
  }

  /**
   * Backend Logout (falls Backend Endpoint hat)
   */
  logoutFromBackend(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return of(null);

    return this.http.post(`${this.apiUrl}/logout`, { refreshToken }).pipe(
      catchError((error) => {
        console.warn('Backend-Logout fehlgeschlagen:', error);
        return of(null);
      })
    );
  }

  /**
   * Vollständiger Logout inkl. Backend
   */
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

  /**
   * Debugging: Alle Token-Infos
   */
  getTokenInfo(): any {
    try {
      const token = this.getAccessToken();
      if (!token) return null;

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

  /**
   * Manuelle Token-Erneuerung (z.B. Debug)
   */
  forceTokenRefresh(): Observable<AuthResponse | null> {
    console.log('Manuelle Token-Erneuerung ausgelöst');
    return this.refreshToken();
  }

  /**
   * Synchrone Methode für Template oder Guards
   */
  public isLoggedIn(): boolean {
    return this.authStatusSubject.value;
  }

  /**
   * Rollen aus JWT extrahieren
   */
  getRoles(): string[] {
    try {
      const token = this.getAccessToken();
      if (!token) return [];
      const payload = JSON.parse(atob(token.split('.')[1]));
      const roles: string[] = payload.roles || payload.authorities || [];
      return roles.map((r: string) => r.replace('ROLE_', ''));
    } catch {
      return [];
    }
  }

  /**
   * Prüft ob der eingeloggte User die ADMIN-Rolle hat
   */
  isAdmin(): boolean {
    return this.getRoles().includes('ADMIN');
  }
}
