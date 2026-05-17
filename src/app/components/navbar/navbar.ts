import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/services/auth';
import { NotificationService } from '../../services/notification.service';
import { NotificationApiService } from '../../services/notification-api.service';
import { ConfirmationService } from 'primeng/api';
import { Subject, interval } from 'rxjs';
import { takeUntil, filter, switchMap, startWith } from 'rxjs/operators';

interface NavItem {
  label: string;
  icon: string;
  routerLink?: string;
  children?: NavItem[];
  public?: boolean;
  adminOnly?: boolean;
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
  
  // Logisch reorganisierte Navigation - Mobile First
  items: NavItem[] = [
    {
      label: 'Dashboard',
      icon: 'bi-speedometer2',
      routerLink: '/dashboard',
      public: true
    },
    { label: 'Analyse', icon: 'bi-bar-chart-line', routerLink: '/analyse', public: false },
    { label: 'Vertragscenter', icon: 'bi-briefcase', routerLink: '/contract-center', public: false },
    {
      label: 'Stammdaten',
      icon: 'bi-database',
      public: false,
      children: [
        { label: 'Kunden', icon: 'bi-people', routerLink: '/customer' },
        { label: 'Adressen', icon: 'bi-geo-alt', routerLink: '/address' },
        { label: 'Produkte', icon: 'bi-box-seam', routerLink: '/product' }
      ]
    },
    {
      label: 'Verträge',
      icon: 'bi-file-earmark-text',
      public: false,
      children: [
        { label: 'Verträge', icon: 'bi-file-text', routerLink: '/contract' },
        { label: 'Abonnements', icon: 'bi-arrow-repeat', routerLink: '/subscription' },
      ]
    },
    {
      label: 'Fakturierung',
      icon: 'bi-receipt',
      public: false,
      children: [
        { label: 'Fälligkeitspläne', icon: 'bi-calendar-event', routerLink: '/due-schedule' },
        { label: 'Rechnungslauf', icon: 'bi-play-circle', routerLink: '/invoice-batch' },
        { label: 'Rechnungen', icon: 'bi-receipt-cutoff', routerLink: '/invoice' },
        { label: 'Offene Posten', icon: 'bi-cash-stack', routerLink: '/open-item' },
        { label: 'Vorgänge', icon: 'bi-list-task', routerLink: '/vorgang' }
      ]
    },
    {
      label: 'Administration',
      icon: 'bi-shield-lock',
      public: false,
      adminOnly: true,
      children: [
        { label: 'Benutzerverwaltung', icon: 'bi-people', routerLink: '/admin' },
        { label: 'Audit-Log', icon: 'bi-clock-history', routerLink: '/audit-logs' }
      ]
    }
  ];

  isCollapsed = true;
  currentUser: string | null = null;
  isDropdownOpen = false;
  activeDropdown: string | null = null;
  showNavbar = true;
  unreadCount = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notification: NotificationService,
    private notificationApi: NotificationApiService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadCurrentUser();
    
    // Router events für Navbar-Sichtbarkeit
    this.router.events
      .pipe(
        takeUntil(this.destroy$),
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe((_event: NavigationEnd) => {
        this.showNavbar = true;
        // Mobile navbar nach Navigation schließen
        if (window.innerWidth < 992 && !this.isCollapsed) {
          this.closeNavbar();
        }
      });
    
    // Auth state changes abonnieren
    this.subscribeToAuthChanges();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Mobile-First: Responsive Handling
  @HostListener('window:resize')
  onResize(): void {
    // Desktop: Dropdowns schließen
    if (window.innerWidth >= 992) {
      this.closeAllDropdowns();
      // Navbar auf Desktop immer eingeklappt (Bootstrap Standard)
      if (!this.isCollapsed) {
        this.isCollapsed = true;
      }
    }
  }

  // Click outside handler
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const navbar = target.closest('.navbar');
    const dropdown = target.closest('.dropdown');
    
    // Mobile: Navbar schließen bei außerhalb Click
    if (!navbar && !this.isCollapsed && window.innerWidth < 992) {
      this.closeNavbar();
    }
    
    // Desktop: Dropdowns schließen
    if (!dropdown && window.innerWidth >= 992) {
      this.closeAllDropdowns();
    }
  }

  // Keyboard accessibility
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeNavbar();
      this.closeAllDropdowns();
    }
  }

  toggleNavbar(): void {
    this.isCollapsed = !this.isCollapsed;
    
    // Mobile: Body scroll management
    if (window.innerWidth < 992) {
      document.body.classList.toggle('navbar-open', !this.isCollapsed);
      if (this.isCollapsed) {
        this.closeAllDropdowns();
      }
    }
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    if (this.isDropdownOpen) {
      this.activeDropdown = null;
    }
  }

  toggleNavDropdown(label: string): void {
    this.activeDropdown = this.activeDropdown === label ? null : label;
    if (this.activeDropdown) {
      this.isDropdownOpen = false;
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
      document.body.classList.remove('navbar-open');
    }
  }

  navigateAndClose(routerLink: string): void {
    this.closeNavbar();
    this.closeAllDropdowns();
    
    this.router.navigate([routerLink]).catch(error => {
      console.error('Navigation error:', error);
    });
  }

  logout(): void {
    this.confirmationService.confirm({
      message: 'Möchten Sie sich wirklich abmelden?',
      header: 'Abmelden',
      icon: 'bi bi-box-arrow-right',
      acceptLabel: 'Abmelden',
      rejectLabel: 'Abbrechen',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.closeAllDropdowns();
        document.body.classList.remove('navbar-open');

        this.authService.logoutComplete().subscribe({
          next: () => {
            this.notification.success('Sie wurden erfolgreich abgemeldet.');
            this.router.navigate(['/dashboard']);
          },
          error: (error) => {
            console.error('Logout error:', error);
            this.authService.logout();
            this.notification.success('Sie wurden erfolgreich abgemeldet.');
            this.router.navigate(['/dashboard']);
          }
        });
      }
    });
  }

  private loadCurrentUser(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  trackByFn(_index: number, item: NavItem): string {
    return item.label;
  }

  trackByChildFn(_index: number, item: NavItem): string {
    return item.routerLink || item.label;
  }

  private subscribeToAuthChanges(): void {
    if (this.authService.authStatus$) {
      this.authService.authStatus$
        .pipe(takeUntil(this.destroy$))
        .subscribe((isAuthenticated: boolean) => {
          if (isAuthenticated) {
            this.loadCurrentUser();
            this.startUnreadPolling();
          } else {
            this.currentUser = null;
            this.unreadCount = 0;
            this.closeNavbar();
            this.closeAllDropdowns();
          }
        });
    }
  }

  private startUnreadPolling(): void {
    interval(60_000).pipe(
      startWith(0),
      takeUntil(this.destroy$),
      switchMap(() => this.notificationApi.countUnread())
    ).subscribe({
      next: (count) => { this.unreadCount = count; },
      error: () => {}
    });
  }
}