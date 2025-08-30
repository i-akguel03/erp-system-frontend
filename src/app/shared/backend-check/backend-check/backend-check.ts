import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-backend-check',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay d-flex align-items-center justify-content-center" 
        [ngClass]="{'backend-ready': backendReady}">
      
      <!-- Loading Animation -->
      <div *ngIf="!backendReady && !timeoutReached" class="text-center fade-in">
        <div class="dots-loading mb-3">
          <span></span><span></span><span></span>
        </div>
        <p class="text-light fs-5">🚀 Server wird gestartet, dies kann bis zu 50 Sekunden dauern...</p>
      </div>

      <!-- Timeout Message -->
      <div *ngIf="timeoutReached" class="text-center shake">
        <i class="bi bi-exclamation-triangle-fill text-danger fs-1 mb-2 jump"></i>
        <p class="text-danger fw-bold fs-5">
          Server konnte nicht erreicht werden.<br> Bitte prüfen Sie die Verbindung.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(20, 20, 20, 0.85);
      z-index: 1050;
      transition: opacity 0.5s ease-in-out;
    }

    .overlay.backend-ready {
      opacity: 0;
      visibility: hidden;
    }

    /* Fade in Effekt */
    .fade-in {
      animation: fadeIn 1s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Pulsierende Punkte Loader */
    .dots-loading {
      display: flex;
      justify-content: center;
      gap: 8px;
    }

    .dots-loading span {
      width: 14px;
      height: 14px;
      background: #0d6efd;
      border-radius: 50%;
      display: inline-block;
      animation: pulse 1.5s infinite;
    }

    .dots-loading span:nth-child(2) {
      animation-delay: 0.3s;
    }
    .dots-loading span:nth-child(3) {
      animation-delay: 0.6s;
    }

    @keyframes pulse {
      0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
      40% { transform: scale(1.3); opacity: 1; }
    }

    /* Shake für Fehlermeldung */
    .shake {
      animation: shake 0.6s ease-in-out;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-10px); }
      40%, 80% { transform: translateX(10px); }
    }

    /* Spring-Animation für das Icon */
    .jump {
      display: inline-block;
      animation: jump 1s infinite ease-in-out;
    }

    @keyframes jump {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-12px); }
    }
  `]
})
export class BackendCheckComponent implements OnInit {

  private baseUrl = environment.apiBaseUrl;

  backendReady = false;
  timeoutReached = false;
  private maxWaitTime = 100000; // 50 Sekunden
  private checkInterval = 3000;

  @Output() backendStatus = new EventEmitter<boolean>();

  constructor(private http: HttpClient) {}

  ngOnInit() {
  const startTime = Date.now();

  const checkBackend = () => {
    if (this.backendReady || this.timeoutReached) return;

    this.http.get(`${this.baseUrl}/actuator/health`)
      .pipe(catchError(() => [null]))
      .subscribe(res => {
        if (res) {
          this.backendReady = true;
          this.backendStatus.emit(true);
        } else if (Date.now() - startTime >= this.maxWaitTime) {
          this.timeoutReached = true;
          this.backendStatus.emit(false);
        }
      });
  };

  // erste Prüfung sofort
  checkBackend();

  // dann alle 3 Sekunden
  const intervalId = setInterval(() => {
    if (this.backendReady || this.timeoutReached) {
      clearInterval(intervalId);
    } else {
      checkBackend();
    }
  }, this.checkInterval);
}

}
