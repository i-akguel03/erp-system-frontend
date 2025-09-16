import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription as RxSubscription } from 'rxjs';

import { Contract } from '../../../../models/Contract';
import { Subscription } from '../../../../models/Subscription';
import { DueSchedule } from '../../../../models/DueSchedule';
import { Invoice } from '../../../../models/Invoice';
import { Customer } from '../../../../models/Customer';
import { OpenItem } from '../../../../models/OpenItem';

import { DueScheduleService } from '../../../../services/due-schedule-service';
import { InvoiceService } from '../../../../services/invoice-service';

import { DueScheduleTabComponent } from './components/due-schedule-tab/due-schedule-tab';
import { InvoiceTabComponent } from './components/invoice-tab/invoice-tab';
import { OpenItemsTabComponent } from './components/open-item-tab/open-item-tab';
import { OpenItemService } from '../../../../services/open-item-service';

interface InvoiceActionEvent {
  action: string;
  invoice: Invoice;
}

interface OpenItemActionEvent {
  action: 'payment' | 'reminder' | 'details' | 'edit' | 'cancel';
  openItem: OpenItem;
}

@Component({
  selector: 'app-financial-tabs',
  standalone: true,
  imports: [
    CommonModule,
    DueScheduleTabComponent,
    InvoiceTabComponent,
    OpenItemsTabComponent
  ],
  templateUrl: './financial-tabs.html',
  styleUrls: ['./financial-tabs.scss']
})
export class FinancialTabsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() selectedContract: Contract | null = null;
  @Input() selectedSubscription: Subscription | null = null;
  @Input() customers: { [id: string]: Customer } = {};

  @Output() invoiceAction = new EventEmitter<InvoiceActionEvent>();
  @Output() openItemAction = new EventEmitter<OpenItemActionEvent>();

  // Data wird jetzt intern geladen
  dueSchedules: DueSchedule[] = [];
  invoices: Invoice[] = [];
  openItems: OpenItem[] = [];
  
  // Loading states
  loading = {
    schedules: false,
    invoices: false,
    openItems: false
  };

  // Error states
  errors = {
    schedules: null as string | null,
    invoices: null as string | null,
    openItems: null as string | null
  };

  activeTab: 'schedule' | 'invoices' | 'openitems' = 'schedule';

  private subscriptions: RxSubscription[] = [];

  constructor(
    private dueScheduleService: DueScheduleService,
    private invoiceService: InvoiceService,
    private openItemService: OpenItemService
  ) {}

  ngOnInit(): void {
    this.loadDataForCurrentSubscription();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedSubscription']) {
      this.loadDataForCurrentSubscription();
    }
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  setActiveTab(tab: 'schedule' | 'invoices' | 'openitems'): void {
    this.activeTab = tab;
  }

  onInvoiceAction(event: InvoiceActionEvent): void {
    this.invoiceAction.emit(event);
  }

  onOpenItemAction(event: OpenItemActionEvent): void {
    this.openItemAction.emit(event);
  }

  getCustomerById(customerId?: string): Customer | undefined {
    if (!customerId) return undefined;
    return this.customers[customerId];
  }

  private loadDataForCurrentSubscription(): void {
    if (!this.selectedSubscription?.id) {
      this.clearData();
      return;
    }

    this.loadDueSchedules();
    this.loadInvoices();
    this.loadOpenItems();
  }

  private loadDueSchedules(): void {
    if (!this.selectedSubscription?.id) return;

    this.loading.schedules = true;
    this.errors.schedules = null;

    const sub = this.dueScheduleService.getDueSchedulesBySubscription(this.selectedSubscription.id).subscribe({
      next: (schedules) => {
        this.dueSchedules = schedules;
        this.loading.schedules = false;
      },
      error: (err) => {
        console.error('Fehler beim Laden der Fälligkeitspläne:', err);
        this.errors.schedules = 'Fehler beim Laden der Fälligkeitspläne';
        this.loading.schedules = false;
        this.dueSchedules = [];
      }
    });

    this.subscriptions.push(sub);
  }

  private loadInvoices(): void {
    if (!this.selectedSubscription?.id) return;

    this.loading.invoices = true;
    this.errors.invoices = null;

    const sub = this.invoiceService.getInvoicesBySubscriptionIds([this.selectedSubscription.id]).subscribe({
      next: (invoices) => {
        this.invoices = invoices;
        this.loading.invoices = false;
      },
      error: (err) => {
        console.error('Fehler beim Laden der Rechnungen:', err);
        this.errors.invoices = 'Fehler beim Laden der Rechnungen';
        this.loading.invoices = false;
        this.invoices = [];
      }
    });

    this.subscriptions.push(sub);
  }

  private loadOpenItems(): void {
    if (!this.selectedSubscription?.id) return;

    this.loading.openItems = true;
    this.errors.openItems = null;

    const sub = this.openItemService.getOpenItemsBySubscription(this.selectedSubscription.id).subscribe({
      next: (openItems) => {
        this.openItems = openItems;
        this.loading.openItems = false;
      },
      error: (err) => {
        console.error('Fehler beim Laden der offenen Posten:', err);
        this.errors.openItems = 'Fehler beim Laden der offenen Posten';
        this.loading.openItems = false;
        this.openItems = [];
      }
    });

    this.subscriptions.push(sub);
  }

  private clearData(): void {
    this.dueSchedules = [];
    this.invoices = [];
    this.openItems = [];
    this.errors = {
      schedules: null,
      invoices: null,
      openItems: null
    };
  }

  // Public methods für Template
  get isLoading(): boolean {
    return this.loading.schedules || this.loading.invoices || this.loading.openItems;
  }

  get hasErrors(): boolean {
    return !!(this.errors.schedules || this.errors.invoices || this.errors.openItems);
  }

  get allErrors(): string[] {
    return [this.errors.schedules, this.errors.invoices, this.errors.openItems]
      .filter(error => error !== null) as string[];
  }

  refreshData(): void {
    this.loadDataForCurrentSubscription();
  }
}