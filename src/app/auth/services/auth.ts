// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  
  private baseUrl = 'https://erp-system-backend-yo8w.onrender.com/auth'; // Backend-URL
  //private baseUrl = 'http://localhost:8080/auth'; // Backend-URL
  private readonly ACCESS_TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';

  constructor(private http: HttpClient) { }

  // ✅ Login Request
  login(data: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, data);
  }

  // ✅ Register Request
 register(data: AuthRequest): Observable<string> {
  // Angular behandelt die Response als Text, kein JSON-Parsing
  return this.http.post(`${this.baseUrl}/register`, data, { responseType: 'text' });
}

  // ✅ Tokens speichern
  saveTokens(tokens: AuthResponse): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    console.log('Tokens erfolgreich gespeichert');
  }

  // ✅ Access Token abrufen
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  // ✅ Refresh Token abrufen
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  // ✅ Erweiterte Logout-Funktion
  logout(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    console.log('Logout erfolgreich - Alle Tokens entfernt');
  }

  // ✅ Alternative: Alle Tokens löschen (Alias für logout)
  clearTokens(): void {
    this.logout();
  }

  // ✅ Prüfen ob User authentifiziert ist
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) {
      return false;
    }

    try {
      // JWT Token dekodieren und Ablaufzeit prüfen
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Prüfen ob Token noch gültig ist
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Fehler beim Token-Check:', error);
      return false;
    }
  }

  // ✅ Username aus Token extrahieren
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

  // ✅ Authorization Header für HTTP Requests
  getAuthorizationHeader(): string | null {
    const token = this.getAccessToken();
    return token ? `Bearer ${token}` : null;
  }

  // ✅ Token-Gültigkeitsdauer abrufen
  getTokenExpirationTime(): Date | null {
    try {
      const token = this.getAccessToken();
      if (!token) {
        return null;
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000); // exp ist in Sekunden, Date braucht Millisekunden
    } catch (error) {
      console.error('Fehler beim Abrufen der Token-Ablaufzeit:', error);
      return null;
    }
  }

  // ✅ Prüfen ob Token bald abläuft (z.B. in den nächsten 5 Minuten)
  isTokenExpiringSoon(minutesThreshold: number = 5): boolean {
    const expirationTime = this.getTokenExpirationTime();
    if (!expirationTime) {
      return false;
    }

    const now = new Date();
    const threshold = new Date(now.getTime() + (minutesThreshold * 60 * 1000));
    
    return expirationTime <= threshold;
  }

  // ✅ Token Refresh (falls Backend unterstützt)
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('Kein Refresh Token verfügbar');
    }

    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, {
      refreshToken: refreshToken
    });
  }

  // ✅ Backend Logout (falls Backend einen Logout-Endpoint hat)
  logoutFromBackend(): Observable<any> {
    return this.http.post(`${this.baseUrl}/logout`, {
      refreshToken: this.getRefreshToken()
    });
  }

  // ✅ Vollständiger Logout mit Backend-Call
  logoutComplete(): Observable<any> {
    // Erst Backend-Logout, dann lokale Tokens löschen
    return new Observable(observer => {
      this.logoutFromBackend().subscribe({
        next: (response) => {
          this.logout(); // Lokale Tokens löschen
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          // Auch bei Backend-Fehler lokale Tokens löschen
          this.logout();
          console.warn('Backend-Logout fehlgeschlagen, lokale Tokens trotzdem entfernt:', error);
          observer.next(null);
          observer.complete();
        }
      });
    });
  }

  // ✅ Debug-Funktion: Token-Info anzeigen
  getTokenInfo(): any {
    try {
      const token = this.getAccessToken();
      if (!token) {
        return null;
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        username: payload.sub || payload.username,
        roles: payload.roles || [],
        issuedAt: new Date(payload.iat * 1000),
        expiresAt: new Date(payload.exp * 1000),
        isExpired: payload.exp <= Math.floor(Date.now() / 1000),
        timeUntilExpiry: new Date(payload.exp * 1000).getTime() - Date.now()
      };
    } catch (error) {
      console.error('Fehler beim Abrufen der Token-Info:', error);
      return null;
    }
  }
}

