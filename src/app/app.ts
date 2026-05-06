import { Component, signal, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth/services/auth';
import { Toast } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { BackendStatusService } from './services/backend-status.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    CardModule,
    CommonModule,
    Toast,
    ConfirmDialog
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  protected readonly title = signal('erp-system-frontend');

  constructor(private auth: AuthService, _backendStatus: BackendStatusService) {}

  protected readonly isLoggedIn = computed(() => this.auth.isAuthenticated());
}
