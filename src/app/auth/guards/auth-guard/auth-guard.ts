import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { jwtDecode } from 'jwt-decode';

// optional: eigenes Payload-Interface definieren
interface JwtPayload {
  exp: number;
  sub: string;
  role?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    const token = this.auth.getAccessToken();
    if (!token || !this.isTokenValid(token)) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }

  private isTokenValid(token: string): boolean {
    try {
      const decoded = jwtDecode<JwtPayload>(token); // ✅ korrekt
      if (!decoded.exp) return false;
      return decoded.exp * 1000 > Date.now(); // Ablauf prüfen
    } catch {
      return false;
    }
  }
}
