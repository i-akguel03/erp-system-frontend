import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Dialog } from 'primeng/dialog';
import { forkJoin } from 'rxjs';

import { OpenItemService } from '../../services/open-item-service';
import { ContractService } from '../../services/contract-service';
import { SubscriptionService } from '../../services/subscription-service';
import { EmailService } from '../../services/email.service';
import { NotificationService } from '../../services/notification.service';
import { DashboardService } from '../../services/dashboard.service';

import { OpenItem, OpenItemStatus } from '../../models/OpenItem';
import { Contract } from '../../models/Contract';
import { Subscription } from '../../models/Subscription';
import { OpenItemsOverviewDto } from '../../models/Dashboard';

type StatusFilter = 'all' | 'overdue' | 'open' | 'partial';
type AgeFilter    = 'all' | '30' | '60' | '90' | '180' | '365';
type DetailTab    = 'uebersicht' | 'verlauf';

interface EnrichedItem extends OpenItem {
  contractNumber?: string;
  daysOverdue?: number;
}

@Component({
  selector: 'app-billing-center',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Dialog],
  templateUrl: './billing-center.html',
  styleUrls: ['./billing-center.scss'],
})
export class BillingCenterComponent implements OnInit {

  loading = true;
  error: string | null = null;

  allItems: EnrichedItem[] = [];
  overview: OpenItemsOverviewDto | null = null;
  contracts     = new Map<string, Contract>();
  subscriptions = new Map<string, Subscription>();

  // ─── Selektion & Detail ────────────────────────────────────────────────────
  selectedItem: EnrichedItem | null = null;
  activeDetailTab: DetailTab = 'uebersicht';

  // ─── Filter ────────────────────────────────────────────────────────────────
  statusFilter: StatusFilter = 'all';
  ageFilter: AgeFilter = 'all';
  searchTerm = '';
  noReminderOnly = false;
  showFilterPanel = false;

  // ─── Pagination ────────────────────────────────────────────────────────────
  currentPage = 0;
  pageSize = 25;

  // ─── Mobile ────────────────────────────────────────────────────────────────
  isMobile = false;
  mobileView: 'list' | 'detail' = 'list';

  // ─── Payment Modal ─────────────────────────────────────────────────────────
  showPayModal = false;
  payAmount = 0;
  payMethod = '';
  payRef = '';
  paying = false;

  // ─── Cancel Modal ──────────────────────────────────────────────────────────
  showCancelModal = false;
  cancelling = false;

  emailSendingId: string | null = null;

  readonly ageOptions: { label: string; value: AgeFilter }[] = [
    { label: 'Alle',        value: 'all' },
    { label: '> 30 Tage',   value: '30' },
    { label: '> 60 Tage',   value: '60' },
    { label: '> 3 Monate',  value: '90' },
    { label: '> 6 Monate',  value: '180' },
    { label: '> 1 Jahr',    value: '365' },
  ];

  constructor(
    private openItemService: OpenItemService,
    private contractService: ContractService,
    private subscriptionService: SubscriptionService,
    private emailService: EmailService,
    private notification: NotificationService,
    private dashboardService: DashboardService,
    private router: Router,
  ) {}

  openInCustomerCenter(item: EnrichedItem): void {
    if (item.customerId) {
      this.router.navigate(['/customer-center'], { queryParams: { customerId: item.customerId } });
    }
  }

  ngOnInit(): void { this.checkMobile(); this.load(); }

  @HostListener('window:resize') onResize(): void { this.checkMobile(); }

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.isMobile && this.mobileView === 'detail') this.navigateBack(); }

  private checkMobile(): void {
    const was = this.isMobile;
    this.isMobile = window.innerWidth <= 768;
    if (was !== this.isMobile && !this.isMobile) {
      this.mobileView = 'list';
      document.body.style.overflow = '';
    }
  }

  navigateBack(): void { this.mobileView = 'list'; }

  // ─── Laden ────────────────────────────────────────────────────────────────
  load(): void {
    this.loading = true;
    this.error = null;
    forkJoin({
      items:         this.openItemService.getAllOpenItems(),
      contracts:     this.contractService.getContracts(false, 0, 500),
      subscriptions: this.subscriptionService.getSubscriptions(false, 0, 500),
      overview:      this.dashboardService.getOpenItemsOverview(),
    }).subscribe({
      next: ({ items, contracts, subscriptions, overview }) => {
        this.contracts     = new Map(contracts.map(c => [c.id!, c]));
        this.subscriptions = new Map(subscriptions.map(s => [s.id!, s]));
        this.overview      = overview;
        this.allItems      = this.enrich(items);
        this.loading       = false;
      },
      error: err => { this.error = err.error?.message || 'Fehler beim Laden'; this.loading = false; }
    });
  }

  private enrich(items: OpenItem[]): EnrichedItem[] {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return items.map(item => {
      const sub      = item.subscriptionId ? this.subscriptions.get(item.subscriptionId) : undefined;
      const contract = sub?.contractId     ? this.contracts.get(sub.contractId)           : undefined;
      let daysOverdue: number | undefined;
      if (item.dueDate) {
        const due = new Date(item.dueDate); due.setHours(0, 0, 0, 0);
        const diff = Math.floor((today.getTime() - due.getTime()) / 86_400_000);
        daysOverdue = diff > 0 ? diff : 0;
      }
      return { ...item, contractNumber: contract?.contractNumber, daysOverdue };
    });
  }

  // ─── Filter-Logik ─────────────────────────────────────────────────────────
  get filteredItems(): EnrichedItem[] {
    let list = [...this.allItems];

    // Bezahlte/stornierte ausblenden (immer, außer bei Tab "Alle")
    if (this.statusFilter !== 'all') {
      const statusMap: Record<StatusFilter, OpenItemStatus> = {
        overdue: OpenItemStatus.OVERDUE,
        open:    OpenItemStatus.OPEN,
        partial: OpenItemStatus.PARTIALLY_PAID,
        all:     OpenItemStatus.OPEN
      };
      list = list.filter(i => i.status === statusMap[this.statusFilter]);
    } else {
      list = list.filter(i => i.status !== OpenItemStatus.PAID && i.status !== OpenItemStatus.CANCELLED);
    }

    // Altersfilter
    if (this.ageFilter !== 'all') {
      const minDays = parseInt(this.ageFilter, 10);
      list = list.filter(i => (i.daysOverdue ?? 0) >= minDays);
    }

    // Nur ohne Mahnung
    if (this.noReminderOnly) {
      const limit = new Date(); limit.setDate(limit.getDate() - 30);
      list = list.filter(i => !i.lastReminderDate || new Date(i.lastReminderDate) < limit);
    }

    // Suche
    const q = this.searchTerm.toLowerCase().trim();
    if (q) {
      list = list.filter(i =>
        i.customerName?.toLowerCase().includes(q) ||
        i.invoiceNumber?.toLowerCase().includes(q) ||
        i.contractNumber?.toLowerCase().includes(q)
      );
    }

    // Sortierung: Überfälligste zuerst
    list.sort((a, b) => (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0));
    return list;
  }

  get pagedItems(): EnrichedItem[] {
    const start = this.currentPage * this.pageSize;
    return this.filteredItems.slice(start, start + this.pageSize);
  }

  get totalElements(): number { return this.filteredItems.length; }
  get totalPages(): number    { return Math.ceil(this.totalElements / this.pageSize); }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(0, this.currentPage - 2);
    const end = Math.min(this.totalPages - 1, this.currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  setStatusFilter(f: StatusFilter): void { this.statusFilter = f; this.currentPage = 0; this.selectedItem = null; }
  setAgeFilter(f: AgeFilter): void { this.ageFilter = f; this.currentPage = 0; }
  onSearchChange(): void { this.currentPage = 0; }
  goToPage(p: number): void { if (p >= 0 && p < this.totalPages) this.currentPage = p; }
  clearFilters(): void { this.statusFilter = 'all'; this.ageFilter = 'all'; this.noReminderOnly = false; this.searchTerm = ''; this.currentPage = 0; }

  get activeFilterCount(): number {
    return (this.statusFilter !== 'all' ? 1 : 0) +
           (this.ageFilter !== 'all' ? 1 : 0) +
           (this.noReminderOnly ? 1 : 0) +
           (this.searchTerm ? 1 : 0);
  }

  // ─── Selektion ────────────────────────────────────────────────────────────
  selectItem(item: EnrichedItem): void {
    this.selectedItem = item;
    this.activeDetailTab = 'uebersicht';
    if (this.isMobile) this.mobileView = 'detail';
  }

  isSelected(item: EnrichedItem): boolean { return this.selectedItem?.id === item.id; }

  // ─── KPIs ─────────────────────────────────────────────────────────────────
  countOf(filter: StatusFilter): number {
    switch (filter) {
      case 'overdue':  return this.allItems.filter(i => i.status === OpenItemStatus.OVERDUE).length;
      case 'open':     return this.allItems.filter(i => i.status === OpenItemStatus.OPEN).length;
      case 'partial':  return this.allItems.filter(i => i.status === OpenItemStatus.PARTIALLY_PAID).length;
      default: return this.allItems.filter(i => i.status !== OpenItemStatus.PAID && i.status !== OpenItemStatus.CANCELLED).length;
    }
  }

  get totalOverdueAmount(): number {
    return this.allItems.filter(i => i.status === OpenItemStatus.OVERDUE).reduce((s, i) => s + (i.outstandingAmount ?? 0), 0);
  }
  get totalOutstanding(): number {
    return this.allItems.filter(i => i.status !== OpenItemStatus.PAID && i.status !== OpenItemStatus.CANCELLED).reduce((s, i) => s + (i.outstandingAmount ?? 0), 0);
  }
  get reminderDueCount(): number {
    const limit = new Date(); limit.setDate(limit.getDate() - 30);
    return this.allItems.filter(i =>
      (i.status === OpenItemStatus.OVERDUE || i.status === OpenItemStatus.OPEN) &&
      (!i.lastReminderDate || new Date(i.lastReminderDate) < limit)
    ).length;
  }

  // ─── Aging Buckets ────────────────────────────────────────────────────────
  get agingBuckets(): { label: string; days: AgeFilter; count: number; amount: number; color: string }[] {
    const overdue = this.allItems.filter(i => i.status === OpenItemStatus.OVERDUE);
    const bucket = (min: number, max: number) => {
      const items = overdue.filter(i => (i.daysOverdue ?? 0) >= min && (i.daysOverdue ?? 0) <= max);
      return { count: items.length, amount: items.reduce((s, i) => s + (i.outstandingAmount ?? 0), 0) };
    };
    const b90 = overdue.filter(i => (i.daysOverdue ?? 0) > 90);
    return [
      { label: '1 – 30 Tage',  days: '30',  ...bucket(1, 30),  color: '#ffc107' },
      { label: '31 – 60 Tage', days: '60',  ...bucket(31, 60), color: '#fd7e14' },
      { label: '61 – 90 Tage', days: '90',  ...bucket(61, 90), color: '#dc3545' },
      { label: '> 90 Tage',    days: '180', count: b90.length, amount: b90.reduce((s, i) => s + (i.outstandingAmount ?? 0), 0), color: '#7f1d1d' },
    ];
  }
  get agingMaxAmount(): number { return Math.max(...this.agingBuckets.map(b => b.amount), 1); }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  statusLabel(s?: OpenItemStatus): string {
    const m: any = { OPEN:'Offen', PARTIALLY_PAID:'Teilbezahlt', PAID:'Bezahlt', CANCELLED:'Storniert', OVERDUE:'Überfällig' };
    return s ? (m[s] ?? s) : '–';
  }
  statusClass(s?: OpenItemStatus): string {
    const m: any = { OPEN:'badge bg-primary', PARTIALLY_PAID:'badge bg-warning text-dark', PAID:'badge bg-success', CANCELLED:'badge bg-secondary', OVERDUE:'badge bg-danger' };
    return s ? (m[s] ?? 'badge bg-secondary') : 'badge bg-secondary';
  }
  statusIcon(s?: OpenItemStatus): string {
    const m: any = { OPEN:'bi-circle text-primary', PARTIALLY_PAID:'bi-circle-half text-warning', PAID:'bi-check-circle-fill text-success', CANCELLED:'bi-dash-circle text-secondary', OVERDUE:'bi-exclamation-circle-fill text-danger' };
    return s ? (m[s] ?? 'bi-circle text-muted') : 'bi-circle text-muted';
  }
  urgencyClass(item: EnrichedItem): string {
    if (item.status !== 'OVERDUE') return '';
    const d = item.daysOverdue ?? 0;
    if (d > 90) return 'bc-item--critical';
    if (d > 30) return 'bc-item--urgent';
    return 'bc-item--overdue';
  }
  fmt(val?: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val ?? 0);
  }
  formatDate(d: any): string {
    if (!d) return '–';
    try { return new Date(d).toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' }); } catch { return '–'; }
  }
  getInitials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  canPay(item: EnrichedItem): boolean { return item.status !== 'CANCELLED' && item.status !== 'PAID'; }
  canCancel(item: EnrichedItem): boolean { return item.status !== 'CANCELLED' && item.status !== 'PAID'; }

  // ─── Aktionen ─────────────────────────────────────────────────────────────
  openPayModal(item?: EnrichedItem): void {
    if (item) this.selectedItem = item;
    if (!this.selectedItem) return;
    this.payAmount = this.selectedItem.outstandingAmount ?? this.selectedItem.amount ?? 0;
    this.payMethod = '';
    this.payRef = '';
    this.showPayModal = true;
  }
  setFullPayment(): void { if (this.selectedItem) this.payAmount = this.selectedItem.outstandingAmount ?? this.selectedItem.amount ?? 0; }
  setHalfPayment(): void { if (this.selectedItem) this.payAmount = Math.round(((this.selectedItem.outstandingAmount ?? this.selectedItem.amount ?? 0) / 2) * 100) / 100; }

  confirmPayment(): void {
    if (!this.selectedItem?.id || this.paying) return;
    this.paying = true;
    this.openItemService.recordPayment(this.selectedItem.id, this.payAmount, this.payMethod, this.payRef).subscribe({
      next: updated => {
        this.paying = false; this.showPayModal = false;
        const enriched = this.enrich([updated])[0];
        const idx = this.allItems.findIndex(i => i.id === updated.id);
        if (idx >= 0) { this.allItems[idx] = enriched; this.allItems = [...this.allItems]; }
        this.selectedItem = enriched;
        this.notification.success('Zahlung wurde erfasst.');
      },
      error: err => { this.paying = false; this.notification.error(err.error?.message || 'Fehler beim Erfassen'); }
    });
  }

  sendReminder(item?: EnrichedItem): void {
    const target = item ?? this.selectedItem;
    if (!target?.id || this.emailSendingId) return;
    this.emailSendingId = target.id;
    this.emailService.sendPaymentReminder(target.id).subscribe({
      next: () => {
        this.emailSendingId = null;
        const i = this.allItems.find(x => x.id === target.id);
        if (i) { i.reminderCount = (i.reminderCount ?? 0) + 1; i.lastReminderDate = new Date(); }
        if (this.selectedItem?.id === target.id) this.selectedItem = { ...this.selectedItem!, reminderCount: (this.selectedItem!.reminderCount ?? 0) + 1, lastReminderDate: new Date() };
        this.notification.success(`Mahnung an ${target.customerName} gesendet.`);
      },
      error: err => { this.emailSendingId = null; this.notification.error(err.error?.message || 'Fehler beim Senden'); }
    });
  }

  openCancelModal(item?: EnrichedItem): void {
    if (item) this.selectedItem = item;
    this.showCancelModal = true;
  }

  confirmCancel(): void {
    if (!this.selectedItem?.id || this.cancelling) return;
    this.cancelling = true;
    this.openItemService.cancelOpenItem(this.selectedItem.id).subscribe({
      next: updated => {
        this.cancelling = false; this.showCancelModal = false;
        const enriched = this.enrich([updated])[0];
        const idx = this.allItems.findIndex(i => i.id === updated.id);
        if (idx >= 0) { this.allItems[idx] = enriched; this.allItems = [...this.allItems]; }
        this.selectedItem = enriched;
        this.notification.success('Posten wurde storniert.');
      },
      error: err => { this.cancelling = false; this.notification.error(err.error?.message || 'Fehler beim Stornieren'); }
    });
  }

  clearError(): void { this.error = null; }
}
