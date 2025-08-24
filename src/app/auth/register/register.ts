// register.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService, AuthRequest } from '../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterComponent {
  
  username = '';
  password = '';
  error = '';
  isRegistered = false; // ✅ Neuer Status für erfolgreiche Registrierung
  
  constructor(private auth: AuthService, private router: Router) { }
  
  register() {
    const req: AuthRequest = { username: this.username, password: this.password };
    this.auth.register(req).subscribe({
      next: () => {
        this.isRegistered = true; // ✅ Erfolgreiche Registrierung
        this.error = ''; // Fehlermeldung zurücksetzen
      },
      error: () => {
        this.error = 'Registrierung fehlgeschlagen';
        this.isRegistered = false;
      }
    });
  }

  // ✅ Methode für Navigation zum Login
  goToLogin() {
    this.router.navigate(['/login']);
  }
}