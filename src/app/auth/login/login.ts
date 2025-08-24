// src/app/auth/login/login.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService, AuthRequest } from '../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  isLoading = false; // ✅ Loading State für bessere UX

  constructor(private auth: AuthService, private router: Router) {}

  login() {
    this.isLoading = true; // ✅ Loading beginnt
    this.error = ''; // ✅ Vorherige Fehler zurücksetzen
    
    const req: AuthRequest = { username: this.username, password: this.password };
    this.auth.login(req).subscribe({
      next: tokens => {
        this.auth.saveTokens(tokens);
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.error = 'Login fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.';
        this.isLoading = false;
      }
    });
  }

  // ✅ Methode für Navigation zur Registrierung
  goToRegister() {
    this.router.navigate(['/register']);
  }
}