import { Component, OnInit } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class NavbarComponent implements OnInit {
  
  items = [
    { label: 'Dashboard', icon: 'bi-speedometer2', routerLink: '/dashboard' },
    {
      label: 'Verwaltung',
      icon: 'bi-folder',
      children: [
        { label: 'Kunden', icon: 'bi-people', routerLink: '/customer' },
        { label: 'Adressen', icon: 'bi-geo', routerLink: '/address' },
        { label: 'Produkte', icon: 'bi-box', routerLink: '/product' },
        { label: 'Verträge', icon: 'bi-file-earmark-text', routerLink: '/contract' },
        { label: 'Abonnements', icon: 'bi-repeat', routerLink: '/subscription' },
        { label: 'Fälligkeitspläne', icon: 'bi-calendar-event', routerLink: '/due-schedule' },
        { label: 'Rechnungen', icon: 'bi-receipt', routerLink: '/invoice' },
        { label: 'Offene Posten', icon: 'bi-cash', routerLink: '/open-item' },
      ]
    },
    { label: 'Vertragscenter', icon: 'bi-briefcase', routerLink: '/contract-center' },
  ];
  
  isCollapsed = true;
  currentUser: string | null = null;
  isDropdownOpen = false;
  activeDropdown: string | null = null; // Verfolgt welches Dropdown offen ist
  showNavbar = true;
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  ngOnInit() {
    this.loadCurrentUser();
    
    // Debug: Items in Konsole ausgeben
    console.log('Navbar Items:', this.items);
    
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.showNavbar = !event.url.includes('/login');
        console.log('Current URL:', event.url);
        console.log('Show Navbar:', this.showNavbar);
      }
    });
  }
  
  toggleNavbar() {
    this.isCollapsed = !this.isCollapsed;
    // Schließe alle Dropdowns wenn Navbar zugeklappt wird
    if (this.isCollapsed) {
      this.activeDropdown = null;
      this.isDropdownOpen = false;
    }
  }
  
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    // Schließe Verwaltung-Dropdown wenn User-Dropdown geöffnet wird
    if (this.isDropdownOpen) {
      this.activeDropdown = null;
    }
  }
  
  toggleNavDropdown(label: string) {
    // Toggle das spezifische Dropdown
    if (this.activeDropdown === label) {
      this.activeDropdown = null;
    } else {
      this.activeDropdown = label;
      this.isDropdownOpen = false; // Schließe User-Dropdown
    }
  }
  
  isNavDropdownOpen(label: string): boolean {
    return this.activeDropdown === label;
  }
  
  closeAllDropdowns() {
    this.isDropdownOpen = false;
    this.activeDropdown = null;
  }
  
  logout() {
    if (confirm('Möchten Sie sich wirklich abmelden?')) {
      console.log('Logout wird ausgeführt...');
      this.closeAllDropdowns();
      this.authService.logout();
      this.currentUser = null;
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
      this.closeAllDropdowns();
    }
  }
  
  // Hilfsfunktion für Navigation mit Dropdown-Schließung
  navigateAndClose(routerLink: string) {
    this.closeNavbar();
    this.closeAllDropdowns();
    this.router.navigate([routerLink]);
  }
}