import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../auth/services/auth';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class NavbarComponent implements OnInit {
  
  items = [
    { label: 'Dashboard', icon: 'bi-speedometer2', routerLink: '/dashboard' },
    { label: 'Kunden', icon: 'bi-people', routerLink: '/customer' },
    { label: 'Produkte', icon: 'bi-box', routerLink: '/products' },
    { label: 'Aufträge', icon: 'bi-cart', routerLink: '/orders' }
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

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  logout() {
    if (confirm('Möchten Sie sich wirklich abmelden?')) {
      this.closeDropdown();
      this.authService.logout();
      this.currentUser = null;
      this.router.navigate(['/login']);
    }
  }

  private loadCurrentUser() {
    this.currentUser = this.authService.getCurrentUser();
  }

  isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }
}
