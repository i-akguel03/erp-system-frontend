import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService, AuthRequest } from '../services/auth';
import { BackendStatusService } from '../../services/backend-status.service';
import { BackendCheckComponent } from '../../shared/backend-check/backend-check/backend-check';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BackendCheckComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  username = 'admin';
  password = 'admin';
  error = '';
  isLoading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    protected backendStatus: BackendStatusService
  ) {}

  get showOverlay(): boolean {
    return this.backendStatus.isReachable() !== true;
  }

  login() {
    if (this.showOverlay) return;
    this.isLoading = true;
    this.error = '';

    const req: AuthRequest = { username: this.username, password: this.password };
    this.auth.login(req).subscribe({
      next: tokens => {
        this.auth.saveTokens(tokens);
        this.isLoading = false;
        this.router.navigate(['/analyse']);
      },
      error: () => {
        this.error = 'Login fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.';
        this.isLoading = false;
      }
    });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}