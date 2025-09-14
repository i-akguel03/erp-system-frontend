// Debugging-Version der Navbar Component
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
    { label: 'Kunden', icon: 'bi-people', routerLink: '/customer' },
    { label: 'Adressen', icon: 'bi-box', routerLink: '/address' },
    { label: 'Produkte', icon: 'bi-box', routerLink: '/product' },
    { label: 'Verträge', icon: 'bi-box', routerLink: '/contract' },
    { label: 'Abonnements', icon: 'bi-box', routerLink: '/subscription' },
    { label: 'Fälligkeitspläne', icon: 'bi-box', routerLink: '/due-schedule' },
    { label: 'Rechnungen', icon: 'bi-box', routerLink: '/invoice' },
    { label: 'Vertragscenter', icon: 'bi-box', routerLink: '/contract-center' },
  ];
  
  isCollapsed = true;
  currentUser: string | null = null;
  isDropdownOpen = false;
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
  }
  
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }
  
  closeDropdown() {
    this.isDropdownOpen = false;
  }
  
  logout() {
    if (confirm('Möchten Sie sich wirklich abmelden?')) {
      console.log('Logout wird ausgeführt...');
      this.closeDropdown();
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
    }
  }
}