import { Component, OnInit } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/services/auth';
// ✅ Korrigiere den Import-Pfad je nach deiner Verzeichnisstruktur

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.html', // ✅ Auch Dateiname korrigiert
  styleUrls: ['./navbar.scss']  // ✅ Auch Dateiname korrigiert
})
export class NavbarComponent implements OnInit {
  
  items = [
    { label: 'Dashboard', icon: 'bi-speedometer2', routerLink: '/dashboard' },
    { label: 'Kunden', icon: 'bi-people', routerLink: '/customer' },
    { label: 'Produkte', icon: 'bi-box', routerLink: '/products' },
    { label: 'Test', icon: 'bi-box', routerLink: '/test' },
    { label: 'Aufträge', icon: 'bi-cart', routerLink: '/orders' }
    // ✅ Logout aus Array entfernt, da es speziell behandelt wird
  ];
     
  isCollapsed = true;
  currentUser: string | null = null;
  isDropdownOpen = false; // ✅ Dropdown State hinzufügen
  showNavbar = true;


  constructor(
    private authService: AuthService, // ✅ Sollte jetzt funktionieren
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCurrentUser();

    // Navbar nur anzeigen, wenn nicht Login-Seite
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.showNavbar = !event.url.includes('/login');
      }
    });
  }

  toggleNavbar() {
    this.isCollapsed = !this.isCollapsed;
  }

  // ✅ Dropdown Toggle hinzufügen
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  // ✅ Dropdown schließen
  closeDropdown() {
    this.isDropdownOpen = false;
  }

  logout() {
    if (confirm('Möchten Sie sich wirklich abmelden?')) {
      console.log('Logout wird ausgeführt...');
      
      // Dropdown schließen
      this.closeDropdown();
      
      // Tokens löschen
      this.authService.logout();
      
      // User zurücksetzen
      this.currentUser = null;
      
      // Zur Login-Seite weiterleiten
      this.router.navigate(['/login']);
      
      console.log('Logout erfolgreich');
    }
  }

  private loadCurrentUser() {
    this.currentUser = this.authService.getCurrentUser();
  }

  isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  closeNavbar() {
  if (!this.isCollapsed) {
    this.isCollapsed = true;
  }
}
}