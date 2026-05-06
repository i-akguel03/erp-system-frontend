import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BackendStatusService } from '../../../services/backend-status.service';

@Component({
  selector: 'app-backend-check',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay d-flex align-items-center justify-content-center">

      <!-- Loading Animation -->
      <div *ngIf="status.isReachable() === null" class="text-center fade-in">
        <div class="dots-loading mb-3">
          <span></span><span></span><span></span>
        </div>
        <p class="text-light fs-5">🚀 Server wird gestartet, dies kann bis zu 50 Sekunden dauern...</p>
      </div>

      <!-- Timeout / Nicht erreichbar -->
      <div *ngIf="status.isReachable() === false" class="text-center shake">
        <i class="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3 jump d-block"></i>
        <p class="text-danger fw-bold fs-5 mb-4">
          Server konnte nicht erreicht werden.<br>Bitte prüfen Sie die Verbindung.
        </p>
        <button class="btn btn-light btn-lg px-4" (click)="goToDashboard()">
          <i class="fas fa-arrow-left me-2"></i>Zurück zum Dashboard
        </button>
      </div>

    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      top: 60px;
      left: 0;
      width: 100%;
      height: calc(100% - 60px);
      background: rgba(20, 20, 20, 0.92);
      z-index: 1049;
    }

    .fade-in {
      animation: fadeIn 1s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

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

    .dots-loading span:nth-child(2) { animation-delay: 0.3s; }
    .dots-loading span:nth-child(3) { animation-delay: 0.6s; }

    @keyframes pulse {
      0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
      40% { transform: scale(1.3); opacity: 1; }
    }

    .shake {
      animation: shake 0.6s ease-in-out;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-10px); }
      40%, 80% { transform: translateX(10px); }
    }

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
export class BackendCheckComponent {
  constructor(protected status: BackendStatusService, private router: Router) {}

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
