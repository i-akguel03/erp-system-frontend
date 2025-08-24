<<<<<<< HEAD
=======
// register.component.ts
>>>>>>> 6b2df44ff80255c44cda5948f2b8a05fc933e89a
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
<<<<<<< HEAD
  successMessage = '';
  isRegistered = false;
  isLoading = false;
=======
  isRegistered = false; // ✅ Neuer Status für erfolgreiche Registrierung
>>>>>>> 6b2df44ff80255c44cda5948f2b8a05fc933e89a
  
  constructor(private auth: AuthService, private router: Router) { }
  
  register() {
<<<<<<< HEAD
    if (!this.username || !this.password) {
      this.error = 'Benutzername und Passwort sind erforderlich';
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.successMessage = '';
    this.isRegistered = false;

    const req: AuthRequest = { username: this.username, password: this.password };
    
    console.log('Registrierung wird gestartet für Benutzer:', this.username);

    this.auth.register(req).subscribe({
      next: (response: string) => {
        console.log('Registrierung erfolgreich:', response);

        this.isRegistered = true;
        this.isLoading = false;
        this.successMessage = response; // plain text vom Backend
      },
      error: (err) => {
        console.error('Registrierung fehlgeschlagen:', err);
        this.isLoading = false;
        this.isRegistered = false;

        if (err.status === 409) {
          this.error = 'Benutzername ist bereits vergeben';
        } else if (err.status === 400) {
          this.error = 'Ungültige Eingabedaten';
        } else if (err.status === 500) {
          this.error = 'Serverfehler. Bitte versuchen Sie es später erneut.';
        } else if (err.status === 0) {
          this.error = 'Verbindung zum Server fehlgeschlagen';
        } else {
          this.error = err.error?.message || 'Registrierung fehlgeschlagen';
        }
      },
      complete: () => console.log('Registrierung-Request abgeschlossen')
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  resetForm() {
    this.username = '';
    this.password = '';
    this.error = '';
    this.successMessage = '';
    this.isRegistered = false;
  }
}
=======
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
>>>>>>> 6b2df44ff80255c44cda5948f2b8a05fc933e89a
