import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/services/auth';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

interface NavItem {
  label: string;
  icon: string;
  routerLink?: string;
  children?: NavItem[];
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();
  
  items: NavItem[] = [
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
        { label: 'Vorgänge', icon: 'bi-cash', routerLink: '/vorgang' },
        { label: 'Rechnungslauf', icon: 'bi-cash', routerLink: '/invoice-batch' },
      ]
    },
    { label: 'Vertragscenter', icon: 'bi-briefcase', routerLink: '/contract-center' },
  ];

  isCollapsed = true;
  currentUser: string | null = null;
  isDropdownOpen = false;
  activeDropdown: string | null = null;
  showNavbar = true;
  isMobile = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.checkScreenSize();
  }

  ngOnInit() {
    this.loadCurrentUser();
    
    // Router events abonnieren
    this.router.events
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.showNavbar = !event.url.includes('/login');
          // Mobile navbar nach Navigation automatisch schließen
          if (this.isMobile && !this.isCollapsed) {
            this.closeNavbar();
          }
        }
      });
    
    // Auth state changes abonnieren (falls Observable vorhanden)
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Screen size detection
  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.checkScreenSize();
    // Desktop: navbar immer offen, Mobile: geschlossen
    if (!this.isMobile) {
      this.isCollapsed = true;
      this.closeAllDropdowns();
    }
  }

  // Click outside handler für mobile
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const navbarElement = target.closest('.navbar');
    const dropdownElement = target.closest('.dropdown');
    
    // Wenn außerhalb der navbar geklickt und mobile navbar offen ist
    if (!navbarElement && !this.isCollapsed && this.isMobile) {
      this.closeNavbar();
    }
    
    // Desktop: Dropdowns schließen wenn außerhalb geklickt
    if (!this.isMobile && !dropdownElement) {
      this.closeAllDropdowns();
    }
  }

  // Keyboard navigation
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeNavbar();
      this.closeAllDropdowns();
    }
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth < 992;
  }

  toggleNavbar(): void {
    this.isCollapsed = !this.isCollapsed;
    
    // Mobile: Dropdowns schließen beim Toggle
    if (this.isMobile && this.isCollapsed) {
      this.closeAllDropdowns();
    }
    
    // Body scroll verhindern wenn mobile navbar offen
    if (this.isMobile) {
      document.body.style.overflow = this.isCollapsed ? 'auto' : 'hidden';
    }
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    
    // Verwaltung-Dropdown schließen wenn User-Dropdown geöffnet wird
    if (this.isDropdownOpen) {
      this.activeDropdown = null;
    }
  }

  toggleNavDropdown(label: string): void {
    // Toggle das spezifische Dropdown
    if (this.activeDropdown === label) {
      this.activeDropdown = null;
    } else {
      this.activeDropdown = label;
      this.isDropdownOpen = false; // User-Dropdown schließen
    }
  }

  isNavDropdownOpen(label: string): boolean {
    return this.activeDropdown === label;
  }

  closeAllDropdowns(): void {
    this.isDropdownOpen = false;
    this.activeDropdown = null;
  }

  closeNavbar(): void {
    if (!this.isCollapsed) {
      this.isCollapsed = true;
      this.closeAllDropdowns();
      
      // Body scroll wieder aktivieren
      if (this.isMobile) {
        document.body.style.overflow = 'auto';
      }
    }
  }

  // Optimierte Navigation mit Loading State
  navigateAndClose(routerLink: string): void {
    // Sofort UI schließen für bessere UX
    this.closeNavbar();
    this.closeAllDropdowns();
    
    // Navigation mit Error Handling
    this.router.navigate([routerLink]).catch(error => {
      console.error('Navigation error:', error);
      // Optionally show toast/alert to user
    });
  }

  logout(): void {
    const confirmMessage = 'Möchten Sie sich wirklich abmelden?';
    
    if (confirm(confirmMessage)) {
      try {
        this.closeAllDropdowns();
        
        // Body scroll reset
        document.body.style.overflow = 'auto';
        
        // Verwende den vollständigen Logout für bessere UX
        this.authService.logoutComplete().subscribe({
          next: () => {
            console.log('Vollständiger Logout erfolgreich');
            this.router.navigate(['/login']);
          },
          error: (error) => {
            console.error('Logout error:', error);
            // Auch bei Fehler zur Login-Seite navigieren
            this.router.navigate(['/login']);
          }
        });
      } catch (error) {
        console.error('Logout error:', error);
        // Fallback: normaler Logout + Navigation
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    }
  }

  private loadCurrentUser(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  isLoggedIn(): boolean {
    // Verwende die synchrone Methode des AuthService
    return this.authService.isLoggedIn();
  }

  // TrackBy functions für bessere Performance
  trackByFn(index: number, item: NavItem): string {
    return item.label;
  }

  trackByChildFn(index: number, item: NavItem): string {
    return item.routerLink || item.label;
  }

  // Auth state subscription helper
  private subscribeToAuthChanges(): void {
    // AuthService hat authStatus$ Observable - verwende dieses
    this.authService.authStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isAuthenticated: boolean) => {
        if (isAuthenticated) {
          this.loadCurrentUser();
        } else {
          this.currentUser = null;
          this.closeNavbar();
          this.closeAllDropdowns();
        }
      });
  }

  // Focus management für Accessibility
  focusFirstMenuItem() {
    setTimeout(() => {
      const firstMenuItem = document.querySelector('.navbar-nav .nav-link') as HTMLElement;
      firstMenuItem?.focus();
    }, 100);
  }

  // Utility method für debugging
  getNavbarState() {
    return {
      isCollapsed: this.isCollapsed,
      isDropdownOpen: this.isDropdownOpen,
      activeDropdown: this.activeDropdown,
      isMobile: this.isMobile,
      showNavbar: this.showNavbar,
      currentUser: this.currentUser,
      isAuthenticated: this.isLoggedIn()
    };
  }
}