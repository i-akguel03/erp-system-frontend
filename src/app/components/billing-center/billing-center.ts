import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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

type Tab = 'overdue' | 'open' | 'partial' | 'all';

interface EnrichedItem extends OpenItem {
  contractNumber?: string;
  daysOverdue?: number;
}

@Component({
  selector: 'app-billing-center',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './billing-center.html',
  styleUrls: ['./billing-center.scss'],
})
export class BillingCenterComponent implements OnInit {

  loading = true;
  error: string | null = null;

  allItems: EnrichedItem[] = [];
  overview: OpenItemsOverviewDto | null = null;

  contracts  = new Map<string, Contract>();
  subscriptions = new Map<string, Subscription>();

  activeTab: Tab = 'overdue';
  searchTerm = '';

  // Payment modal
  showPayModal = false;
  payItem: EnrichedItem | null = null;
  payAmount = 0;
  payMethod = '';
  payRef = '';
  paying = false;

  // Cancel confirm
  showCancelModal = false;
  cancelItem: EnrichedItem | null = null;
  cancelling = false;

  // Email sending tracker
  emailSendingId: string | null = null;

  constructor(
    private openItemService: OpenItemService,
    private contractService: ContractService,
    private subscriptionService: SubscriptionService,
    private emailService: EmailService,
    private notification: NotificationService,
    private dashboardService: DashboardService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

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
      error: err => {
        this.error   = err.error?.message || 'Fehler beim Laden der Abrechnungsdaten';
        this.loading = false;
      }
    });
  }

  private enrich(items: OpenItem[]): EnrichedItem[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return items.map(item => {
      const sub      = item.subscriptionId ? this.subscriptions.get(item.subscriptionId) : undefined;
      const contract = sub?.contractId     ? this.contracts.get(sub.contractId)           : undefined;

      let daysOverdue: number | undefined;
      if (item.dueDate) {
        const due = new Date(item.dueDate);
        due.setHours(0, 0, 0, 0);
        const diff = Math.floor((today.getTime() - due.getTime()) / 86_400_000);
        daysOverdue = diff > 0 ? diff : 0;
      }

      return { ...item, contractNumber: contract?.contractNumber, daysOverdue };
    });
  }

  get filtered(): EnrichedItem[] {
    const term = this.searchTerm.toLowerCase();
    return this.tabItems.filter(i =>
      !term ||
      i.customerName?.toLowerCase().includes(term) ||
      i.invoiceNumber?.toLowerCase().includes(term) ||
      i.contractNumber?.toLowerCase().includes(term)
    );
  }

  get tabItems(): EnrichedItem[] {
    switch (this.activeTab) {
      case 'overdue':  return this.allItems.filter(i => i.status === OpenItemStatus.OVERDUE);
      case 'open':     return this.allItems.filter(i => i.status === OpenItemStatus.OPEN);
      case 'partial':  return this.allItems.filter(i => i.status === OpenItemStatus.PARTIALLY_PAID);
      default:         return this.allItems.filter(i =>
        i.status !== OpenItemStatus.PAID && i.status !== OpenItemStatus.CANCELLED
      );
    }
  }

  countOf(tab: Tab): number {
    switch (tab) {
      case 'overdue': return this.allItems.filter(i => i.status === OpenItemStatus.OVERDUE).length;
      case 'open':    return this.allItems.filter(i => i.status === OpenItemStatus.OPEN).length;
      case 'partial': return this.allItems.filter(i => i.status === OpenItemStatus.PARTIALLY_PAID).length;
      default:        return this.allItems.filter(i =>
        i.status !== OpenItemStatus.PAID && i.status !== OpenItemStatus.CANCELLED
      ).length;
    }
  }

  // ─── KPIs ────────────────────────────────────────────────────
  get totalOverdueAmount(): number {
    return this.allItems
      .filter(i => i.status === OpenItemStatus.OVERDUE)
      .reduce((s, i) => s + (i.outstandingAmount ?? i.amount ?? 0), 0);
  }

  get totalOutstanding(): number {
    return this.allItems
      .filter(i => i.status !== OpenItemStatus.PAID && i.status !== OpenItemStatus.CANCELLED)
      .reduce((s, i) => s + (i.outstandingAmount ?? i.amount ?? 0), 0);
  }

  get reminderDueCount(): number {
    const limit = new Date();
    limit.setDate(limit.getDate() - 30);
    return this.allItems.filter(i =>
      (i.status === OpenItemStatus.OVERDUE || i.status === OpenItemStatus.OPEN) &&
      (!i.lastReminderDate || new Date(i.lastReminderDate) < limit)
    ).length;
  }

  // ─── Aging ───────────────────────────────────────────────────
  get agingBuckets(): { label: string; count: number; amount: number; color: string }[] {
    const overdue = this.allItems.filter(i => i.status === OpenItemStatus.OVERDUE && i.daysOverdue! > 0);
    const bucket = (min: number, max: number) => {
      const items = overdue.filter(i => i.daysOverdue! >= min && i.daysOverdue! <= max);
      return { count: items.length, amount: items.reduce((s, i) => s + (i.outstandingAmount ?? i.amount ?? 0), 0) };
    };
    const b90 = overdue.filter(i => i.daysOverdue! > 90);
    return [
      { label: '1 – 30 Tage',  ...bucket(1, 30),  color: '#ffc107' },
      { label: '31 – 60 Tage', ...bucket(31, 60), color: '#fd7e14' },
      { label: '61 – 90 Tage', ...bucket(61, 90), color: '#dc3545' },
      { label: '> 90 Tage',    count: b90.length, amount: b90.reduce((s, i) => s + (i.outstandingAmount ?? i.amount ?? 0), 0), color: '#7f1d1d' },
    ];
  }

  get agingMaxAmount(): number {
    return Math.max(...this.agingBuckets.map(b => b.amount), 1);
  }

  // ─── Status helpers ───────────────────────────────────────────
  statusLabel(s?: OpenItemStatus): string {
    const map: Record<string, string> = {
      OPEN: 'Offen', PARTIALLY_PAID: 'Teilbezahlt', PAID: 'Bezahlt',
      CANCELLED: 'Storniert', OVERDUE: 'Überfällig'
    };
    return s ? (map[s] ?? s) : '-';
  }

  statusClass(s?: OpenItemStatus): string {
    const map: Record<string, string> = {
      OPEN: 'badge bg-primary', PARTIALLY_PAID: 'badge bg-warning text-dark',
      PAID: 'badge bg-success', CANCELLED: 'badge bg-secondary', OVERDUE: 'badge bg-danger'
    };
    return s ? (map[s] ?? 'badge bg-secondary') : 'badge bg-secondary';
  }

  fmt(val?: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val ?? 0);
  }

  // ─── Actions ─────────────────────────────────────────────────
  openPayModal(item: EnrichedItem): void {
    this.payItem   = item;
    this.payAmount = item.outstandingAmount ?? item.amount ?? 0;
    this.payMethod = '';
    this.payRef    = '';
    this.showPayModal = true;
  }

  confirmPayment(): void {
    if (!this.payItem?.id || this.paying) return;
    this.paying = true;
    this.openItemService.recordPayment(this.payItem.id, this.payAmount, this.payMethod, this.payRef).subscribe({
      next: updated => {
        this.paying = false;
        this.showPayModal = false;
        const idx = this.allItems.findIndex(i => i.id === updated.id);
        if (idx >= 0) {
          const enriched = this.enrich([updated])[0];
          this.allItems[idx] = enriched;
          this.allItems = [...this.allItems];
        }
        this.notification.success('Zahlung wurde erfasst.');
      },
      error: err => {
        this.paying = false;
        this.notification.error(err.error?.message || 'Fehler beim Erfassen der Zahlung');
      }
    });
  }

  sendReminder(item: EnrichedItem): void {
    if (!item.id || this.emailSendingId) return;
    this.emailSendingId = item.id;
    this.emailService.sendPaymentReminder(item.id).subscribe({
      next: () => {
        this.emailSendingId = null;
        // update reminder count locally
        const i = this.allItems.find(x => x.id === item.id);
        if (i) { i.reminderCount = (i.reminderCount ?? 0) + 1; i.lastReminderDate = new Date(); }
        this.notification.success(`Mahnung an ${item.customerName} gesendet.`);
      },
      error: err => {
        this.emailSendingId = null;
        this.notification.error(err.error?.message || 'Fehler beim Senden der Mahnung');
      }
    });
  }

  openCancelModal(item: EnrichedItem): void {
    this.cancelItem = item;
    this.showCancelModal = true;
  }

  confirmCancel(): void {
    if (!this.cancelItem?.id || this.cancelling) return;
    this.cancelling = true;
    this.openItemService.cancelOpenItem(this.cancelItem.id).subscribe({
      next: updated => {
        this.cancelling = false;
        this.showCancelModal = false;
        const idx = this.allItems.findIndex(i => i.id === updated.id);
        if (idx >= 0) { this.allItems[idx] = this.enrich([updated])[0]; this.allItems = [...this.allItems]; }
        this.notification.success('Posten wurde storniert.');
      },
      error: err => {
        this.cancelling = false;
        this.notification.error(err.error?.message || 'Fehler beim Stornieren');
      }
    });
  }

  clearError(): void { this.error = null; }
}
