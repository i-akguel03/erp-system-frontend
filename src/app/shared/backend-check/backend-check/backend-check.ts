import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';

@Component({
  selector: 'app-backend-check',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay" [ngClass]="{'backend-ready': backendReady}">
      <div *ngIf="!backendReady && !timeoutReached">
        <div class="spinner-border text-primary" role="status"></div>
        <p>Server wird gestartet, dies kann bis zu 50 Sekunden dauern...</p>
      </div>
      <p *ngIf="timeoutReached" class="text-danger">
        Server konnte nicht erreicht werden. Bitte prüfen Sie die Verbindung.
      </p>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      top:0; left:0; right:0; bottom:0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: rgba(255,255,255,0.85);
      z-index: 9999;
      font-size: 1.2rem;
      text-align: center;
      transition: background-color 0.3s ease;
    }
    .overlay.backend-ready {
      background-color: white; /* bleibt weiß, sobald Backend bereit */
    }
  `]
})
export class BackendCheckComponent implements OnInit {
  backendReady = false;
  timeoutReached = false;
  private maxWaitTime = 50000; // 50 Sekunden
  private checkInterval = 3000;

  @Output() backendStatus = new EventEmitter<boolean>();

  constructor(private http: HttpClient) {}

  ngOnInit() {
  const startTime = Date.now();

  const checkBackend = () => {
    if (this.backendReady || this.timeoutReached) return;

    this.http.get('https://erp-system-backend-yo8w.onrender.com/actuator/health')
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
