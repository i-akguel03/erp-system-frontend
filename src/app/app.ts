import { Component, signal, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { BackendCheckComponent } from './shared/backend-check/backend-check/backend-check';
import { AuthService } from './auth/services/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    CardModule,
    CommonModule,
    BackendCheckComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  protected readonly title = signal('erp-system-frontend');
  protected backendReady = signal(false);

  constructor(private : AuthService) {}

  // Computed Signal: ist User eingeloggt?
  protected readonly isLoggedIn = computed(() => this.auth.isAuthenticated());
}
