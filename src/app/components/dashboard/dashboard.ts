import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardKpiDto } from '../../models/Dashboard';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {

  githubFrontend = 'https://github.com/i-akguel03/erp-system-frontend';
  githubBackend  = 'https://github.com/i-akguel03/erp-system-backend';
  swaggerUrl     = 'https://erp-system-backend-yo8w.onrender.com/swagger-ui/index.html';
  liveUrl        = 'https://erp-system-frontend-tan.vercel.app/';

  kpi: DashboardKpiDto | null = null;
  kpiLoading = false;

  stack = [
    { label: 'Angular 20',        icon: 'bi bi-lightning-charge-fill', color: '#dd0031' },
    { label: 'TypeScript 5.8',    icon: 'bi bi-filetype-tsx',          color: '#3178c6' },
    { label: 'Spring Boot 3',     icon: 'bi bi-server',                color: '#6db33f' },
    { label: 'Java 21',           icon: 'bi bi-braces',                color: '#f89820' },
    { label: 'Spring Security',   icon: 'bi bi-shield-lock-fill',      color: '#6db33f' },
    { label: 'JWT',               icon: 'bi bi-key-fill',              color: '#d63384' },
    { label: 'PostgreSQL',        icon: 'bi bi-database-fill',         color: '#336791' },
    { label: 'JPA / Hibernate',   icon: 'bi bi-table',                 color: '#59666c' },
    { label: 'Bootstrap 5',       icon: 'bi bi-layout-wtf',            color: '#7952b3' },
    { label: 'PrimeNG',           icon: 'bi bi-grid-1x2-fill',         color: '#4f46e5' },
    { label: 'Docker',            icon: 'bi bi-box-seam-fill',         color: '#2496ed' },
    { label: 'REST / OpenAPI',    icon: 'bi bi-file-earmark-code-fill',color: '#85ea2d' },
    { label: 'Vercel',            icon: 'bi bi-cloud-arrow-up-fill',   color: '#000000' },
    { label: 'Render',            icon: 'bi bi-cloud-check-fill',      color: '#46e3b7' },
  ];

  domains = [
    {
      icon: 'bi bi-people-fill',
      color: '#667eea',
      title: 'Kunden & Adressen',
      desc: 'Vollständiges CRM mit Adressverknüpfung, Suchautovervollständigung und Willkommens-E-Mail.',
      tags: ['CRUD', 'Adress-Suche', 'E-Mail']
    },
    {
      icon: 'bi bi-box-seam-fill',
      color: '#11998e',
      title: 'Produkte & Inventar',
      desc: 'Produktkatalog mit Preisen, Einheiten, Typen und Lagerbestandsverwaltung.',
      tags: ['Katalog', 'Bestand', 'Kategorien']
    },
    {
      icon: 'bi bi-file-earmark-text-fill',
      color: '#f45c43',
      title: 'Verträge & Abonnements',
      desc: 'Geschäftslogik für Vertragslaufzeiten, automatische Abo-Zustände und Ablaufbenachrichtigungen.',
      tags: ['Lifecycle', 'Status-Automat', 'Kündigungslogik']
    },
    {
      icon: 'bi bi-receipt-cutoff',
      color: '#f7971e',
      title: 'Rechnungsstellung',
      desc: 'Automatisierter Batch-Rechnungslauf mit Transaktionsmanagement, Rollback und Datumssteuerung.',
      tags: ['Batch-Processing', 'Transaktion', 'Rollback']
    },
    {
      icon: 'bi bi-cash-stack',
      color: '#4facfe',
      title: 'Offene Posten & Zahlungen',
      desc: 'Forderungsmanagement mit Aging-Analyse, Teilzahlungen, Mahnwesen und Echtzeit-Statusverfolgung.',
      tags: ['Aging', 'Teilzahlungen', 'Mahnwesen']
    },
    {
      icon: 'bi bi-calendar-event-fill',
      color: '#a18cd1',
      title: 'Fälligkeitspläne',
      desc: 'Automatische Generierung von Zahlungsplänen aus Abonnements mit konfigurierbaren Intervallen.',
      tags: ['Automatisierung', 'Intervalle', 'Scheduling']
    },
    {
      icon: 'bi bi-bell-fill',
      color: '#fd7e14',
      title: 'Benachrichtigungen',
      desc: 'System-Benachrichtigungen mit E-Mail-Integration (JavaMail), Polling und Gelesen-Status.',
      tags: ['E-Mail', 'JavaMail', 'Real-time']
    },
    {
      icon: 'bi bi-clock-history',
      color: '#dc3545',
      title: 'Audit-Log & Compliance',
      desc: 'Lückenlose Nachverfolgung aller Datenänderungen mit Vorher-Nachher-Vergleich und Benutzeridentifikation.',
      tags: ['Compliance', 'Versionierung', 'Traceability']
    },
    {
      icon: 'bi bi-bar-chart-line-fill',
      color: '#20c997',
      title: 'Analytics & KPI-Dashboard',
      desc: 'Live-Kennzahlen: MRR, Kundenzahl, offene Posten, monatliche Umsatzverläufe und Zahlungsausstände.',
      tags: ['MRR', 'Umsatz', 'Live-Daten']
    },
  ];

  patterns = [
    { icon: 'bi bi-layers-fill',          title: 'Clean Architecture',        desc: 'Controller → Service → Repository, strikt getrennt.' },
    { icon: 'bi bi-arrow-left-right',      title: 'DTO Pattern',               desc: 'MapStruct-Mapper für typsichere API-Schicht.' },
    { icon: 'bi bi-shield-check',          title: 'RBAC + JWT',                desc: 'Rollenbasierte Zugriffskontrolle mit stateless Tokens.' },
    { icon: 'bi bi-exclamation-triangle',  title: 'Global Exception Handling',  desc: '@ControllerAdvice mit strukturierten Error-DTOs.' },
    { icon: 'bi bi-lightning-fill',        title: 'Batch & Transaktionen',     desc: '@Transactional mit Rollback-Strategie bei Fehlern.' },
    { icon: 'bi bi-eye-fill',              title: 'Audit-Logging',             desc: 'AOP-basiertes Logging aller schreibenden Operationen.' },
  ];

  constructor(
    private auth: AuthService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.loadKpi();
    }
  }

  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  private loadKpi(): void {
    this.kpiLoading = true;
    this.dashboardService.getKpi().subscribe({
      next: data => { this.kpi = data; this.kpiLoading = false; },
      error: ()   => { this.kpiLoading = false; }
    });
  }

  formatCurrency(val: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
  }
}
