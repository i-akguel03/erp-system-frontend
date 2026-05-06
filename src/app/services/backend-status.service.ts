import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BackendStatusService {
  readonly isReachable = signal<boolean | null>(null); // null = noch prüfend

  private baseUrl = environment.apiBaseUrl;
  private maxWaitTime = 100000;
  private checkInterval = 3000;

  constructor(private http: HttpClient) {
    this.startChecking();
  }

  private startChecking(): void {
    const startTime = Date.now();

    const check = () => {
      this.http.get(`${this.baseUrl}/actuator/health`)
        .pipe(catchError(() => [null]))
        .subscribe(res => {
          if (res) {
            this.isReachable.set(true);
          } else if (Date.now() - startTime >= this.maxWaitTime) {
            this.isReachable.set(false);
          }
        });
    };

    check();

    const intervalId = setInterval(() => {
      const status = this.isReachable();
      if (status === true || (status === false && Date.now() - startTime >= this.maxWaitTime)) {
        clearInterval(intervalId);
      } else {
        check();
      }
    }, this.checkInterval);
  }
}
