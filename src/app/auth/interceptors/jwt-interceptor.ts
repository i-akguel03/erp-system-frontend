import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    
    // Token zu Request hinzufügen (außer bei Login/Register/Refresh)
    if (this.shouldAddToken(req)) {
      req = this.addTokenToRequest(req);
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        
        // Bei 401 Fehler automatisch Token refresh versuchen
        if (error.status === 401 && this.shouldRefreshOnError(req)) {
          return this.handle401Error(req, next);
        }
        
        return throwError(() => error);
      })
    );
  }

  private shouldAddToken(req: HttpRequest<any>): boolean {
    // Token nicht zu diesen Endpoints hinzufügen
    const excludedUrls = ['/auth/login', '/auth/register', '/auth/refresh'];
    return !excludedUrls.some(url => req.url.includes(url));
  }

  private shouldRefreshOnError(req: HttpRequest<any>): boolean {
    // Refresh nicht bei diesen Endpoints
    const excludedUrls = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];
    return !excludedUrls.some(url => req.url.includes(url));
  }

  private addTokenToRequest(req: HttpRequest<any>): HttpRequest<any> {
    const token = this.authService.getAccessToken();
    if (token) {
      return req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    return req;
  }

  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((result) => {
          this.isRefreshing = false;
          
          if (result && result.accessToken) {
            this.refreshTokenSubject.next(result.accessToken);
            return next.handle(this.addTokenToRequest(req));
          } else {
            // Refresh fehlgeschlagen - zur Login-Seite weiterleiten
            this.authService.logout();
            return throwError(() => new Error('Token refresh fehlgeschlagen'));
          }
        }),
        catchError((error) => {
          this.isRefreshing = false;
          this.authService.logout();
          return throwError(() => error);
        })
      );
    } else {
      // Warten bis Refresh abgeschlossen ist, dann Request wiederholen
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(() => next.handle(this.addTokenToRequest(req)))
      );
    }
  }
}