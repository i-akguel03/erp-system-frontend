// financial-tabs.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription as RxSubscription } from 'rxjs';

import { Contract } from '../../../../models/Contract';
import { Subscription } from '../../../../models/Subscription';
import { DueSchedule } from '../../../../models/DueSchedule';
import { Invoice } from '../../../../models/Invoice';
import { Customer } from '../../../../models/Customer';
import { OpenItem } from '../../../../models/OpenItem';

import { DueScheduleService } from '../../../../services/due-schedule-service';
import { InvoiceService } from '../../../../services/invoice-service';
import { OpenItemService } from '../../../../services/open-item-service';

import { DueScheduleTabComponent } from './components/due-schedule-tab/due-schedule-tab';
import { InvoiceTabComponent } from './components/invoice-tab/invoice-tab';
import { OpenItemsTabComponent } from './components/open-item-tab/open-item-tab';

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
    FormsModule,
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

  // Modal states
  showPaymentModal = false;
  showEditInvoiceModal = false;
  showEditOpenItemModal = false;

  // Modal data
  selectedInvoiceForEdit: Invoice | null = null;
  selectedOpenItemForPayment: OpenItem | null = null;
  selectedOpenItemForEdit: OpenItem | null = null;

  // Zahlungsformular
  paymentAmount: number = 0;
  paymentMethod: string = '';
  paymentReference: string = '';

  // Bearbeitungsformulare
  editInvoice: Invoice = {} as Invoice;
  editOpenItem: OpenItem = {} as OpenItem;
  editInvoiceDateString: string = '';
  editDueDateString: string = '';
  editOpenItemDueDateString: string = '';

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

  // Invoice Action Handler
  onInvoiceAction(event: InvoiceActionEvent): void {
    console.log('Invoice Action:', event);
    
    switch (event.action) {
      case 'edit':
        this.openEditInvoiceModal(event.invoice);
        break;
      case 'send':
        this.sendInvoice(event.invoice);
        break;
      case 'cancel':
        this.cancelInvoice(event.invoice);
        break;
      case 'delete':
        this.deleteInvoice(event.invoice);
        break;
      case 'duplicate':
        this.duplicateInvoice(event.invoice);
        break;
      default:
        // Für andere Actions an Parent weiterleiten
        this.invoiceAction.emit(event);
    }
  }

  // OpenItem Action Handler
  onOpenItemAction(event: OpenItemActionEvent): void {
    console.log('OpenItem Action:', event);
    
    switch (event.action) {
      case 'payment':
        this.openPaymentModal(event.openItem);
        break;
      case 'edit':
        this.openEditOpenItemModal(event.openItem);
        break;
      case 'reminder':
        this.addReminder(event.openItem);
        break;
      case 'cancel':
        this.cancelOpenItem(event.openItem);
        break;
      case 'details':
        // Details werden bereits in der Child-Komponente behandelt
        console.log('Details Action - wird in Child-Komponente behandelt');
        break;
      default:
        // Für andere Actions an Parent weiterleiten
        this.openItemAction.emit(event);
    }
  }

  // Invoice Actions
  private sendInvoice(invoice: Invoice): void {
    if (!invoice.id) return;
    
    this.invoiceService.sendInvoice(invoice.id).subscribe({
      next: (updated) => {
        this.updateLocalInvoice(updated);
        this.showSuccessMessage('Rechnung wurde versendet');
      },
      error: (err) => this.handleError('Fehler beim Versenden der Rechnung', err)
    });
  }

  private cancelInvoice(invoice: Invoice): void {
    if (!invoice.id || !confirm('Möchten Sie diese Rechnung wirklich stornieren?')) return;
    
    this.invoiceService.cancelInvoice(invoice.id).subscribe({
      next: (updated) => {
        this.updateLocalInvoice(updated);
        this.showSuccessMessage('Rechnung wurde storniert');
      },
      error: (err) => this.handleError('Fehler beim Stornieren der Rechnung', err)
    });
  }

  private deleteInvoice(invoice: Invoice): void {
    if (!invoice.id || !confirm('Möchten Sie diese Rechnung wirklich löschen?')) return;
    
    this.invoiceService.deleteInvoice(invoice.id).subscribe({
      next: () => {
        this.invoices = this.invoices.filter(i => i.id !== invoice.id);
        this.showSuccessMessage('Rechnung wurde gelöscht');
      },
      error: (err) => this.handleError('Fehler beim Löschen der Rechnung', err)
    });
  }

  private duplicateInvoice(invoice: Invoice): void {
    if (!invoice.id) return;
    
    // this.invoiceService.duplicateInvoice(invoice.id).subscribe({
    //   next: (duplicated) => {
    //     this.invoices.push(duplicated);
    //     this.showSuccessMessage('Rechnung wurde dupliziert');
    //   },
    //   error: (err) => this.handleError('Fehler beim Duplizieren der Rechnung', err)
    // });
  }

  // OpenItem Actions
  private addReminder(openItem: OpenItem): void {
    if (!openItem.id) return;
    
    this.openItemService.addReminder(openItem.id).subscribe({
      next: (updated) => {
        this.updateLocalOpenItem(updated);
        this.showSuccessMessage('Mahnung wurde hinzugefügt');
      },
      error: (err) => this.handleError('Fehler beim Hinzufügen der Mahnung', err)
    });
  }

  private cancelOpenItem(openItem: OpenItem): void {
    if (!openItem.id || !confirm('Möchten Sie diesen offenen Posten wirklich stornieren?')) return;
    
    this.openItemService.cancelOpenItem(openItem.id).subscribe({
      next: (updated) => {
        this.updateLocalOpenItem(updated);
        this.showSuccessMessage('Offener Posten wurde storniert');
      },
      error: (err) => this.handleError('Fehler beim Stornieren des offenen Postens', err)
    });
  }

  // Modal Management - Payment
  openPaymentModal(openItem: OpenItem): void {
    console.log('Opening payment modal for:', openItem);
    this.selectedOpenItemForPayment = { ...openItem };
    this.paymentAmount = openItem.outstandingAmount || 0;
    this.paymentMethod = '';
    this.paymentReference = '';
    this.showPaymentModal = true;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.selectedOpenItemForPayment = null;
    this.paymentAmount = 0;
    this.paymentMethod = '';
    this.paymentReference = '';
  }

  // Modal Management - Edit Invoice
  openEditInvoiceModal(invoice: Invoice): void {
    if (!invoice) {
      console.error('Fehler: Invoice ist null oder undefined');
      this.handleError('Keine gültige Rechnung zum Bearbeiten ausgewählt');
      return;
    }
    
    this.selectedInvoiceForEdit = { ...invoice };
    this.editInvoice = { ...invoice };
    this.editInvoiceDateString = this.formatDateForInput(invoice.invoiceDate || new Date());
    this.editDueDateString = this.formatDateForInput(invoice.dueDate || new Date());
    this.showEditInvoiceModal = true;
  }

  closeEditInvoiceModal(): void {
    this.showEditInvoiceModal = false;
    this.selectedInvoiceForEdit = null;
  }

  // Modal Management - Edit OpenItem
  openEditOpenItemModal(openItem: OpenItem): void {
    console.log('Opening edit modal for OpenItem:', openItem);
    if (!openItem) {
      console.error('Fehler: OpenItem ist null oder undefined');
      this.handleError('Kein gültiger offener Posten zum Bearbeiten ausgewählt');
      return;
    }
    
    this.selectedOpenItemForEdit = { ...openItem };
    this.editOpenItem = { ...openItem };
    this.editOpenItemDueDateString = this.formatDateForInput(openItem.dueDate || new Date());
    this.showEditOpenItemModal = true;
  }

  closeEditOpenItemModal(): void {
    this.showEditOpenItemModal = false;
    this.selectedOpenItemForEdit = null;
  }

  // Form Actions - Payment
  recordPayment(): void {
    if (!this.selectedOpenItemForPayment?.id || !this.paymentAmount || this.paymentAmount <= 0) {
      this.handleError('Bitte geben Sie einen gültigen Zahlungsbetrag ein');
      return;
    }

    if (this.paymentAmount > (this.selectedOpenItemForPayment.outstandingAmount || 0)) {
      this.handleError('Der Zahlungsbetrag darf den ausstehenden Betrag nicht überschreiten');
      return;
    }

    this.openItemService.recordPayment(
      this.selectedOpenItemForPayment.id,
      this.paymentAmount,
      this.paymentMethod || undefined,
      this.paymentReference || undefined
    ).subscribe({
      next: (updated) => {
        this.updateLocalOpenItem(updated);
        this.closePaymentModal();
        this.showSuccessMessage('Zahlung wurde erfolgreich gebucht');
      },
      error: (err) => this.handleError('Fehler beim Buchen der Zahlung', err)
    });
  }

  // Form Actions - Update Invoice
  updateInvoice(): void {
    if (!this.editInvoice.id) return;

    const invoiceToUpdate: Invoice = {
      ...this.editInvoice,
      invoiceDate: this.editInvoiceDateString ? new Date(this.editInvoiceDateString) : new Date(),
      dueDate: this.editDueDateString ? new Date(this.editDueDateString) : undefined
    };

    this.invoiceService.updateInvoice(this.editInvoice.id, invoiceToUpdate).subscribe({
      next: (updated) => {
        this.updateLocalInvoice(updated);
        this.closeEditInvoiceModal();
        this.showSuccessMessage('Rechnung wurde aktualisiert');
      },
      error: (err) => this.handleError('Fehler beim Aktualisieren der Rechnung', err)
    });
  }

  // Form Actions - Update OpenItem
  updateOpenItem(): void {
    if (!this.editOpenItem.id) {
      this.handleError('Keine gültige ID für Update gefunden');
      return;
    }

    const openItemToUpdate: OpenItem = {
      ...this.editOpenItem,
      dueDate: this.editOpenItemDueDateString ? new Date(this.editOpenItemDueDateString) : new Date()
    };

    this.openItemService.updateOpenItem(this.editOpenItem.id, openItemToUpdate).subscribe({
      next: (updated) => {
        this.updateLocalOpenItem(updated);
        this.closeEditOpenItemModal();
        this.showSuccessMessage('Offener Posten wurde aktualisiert');
      },
      error: (err) => this.handleError('Fehler beim Aktualisieren des offenen Postens', err)
    });
  }

  // Helper Methods
  private updateLocalInvoice(updated: Invoice): void {
    const index = this.invoices.findIndex(i => i.id === updated.id);
    if (index >= 0) {
      this.invoices[index] = updated;
    }
  }

  private updateLocalOpenItem(updated: OpenItem): void {
    console.log('Updating local OpenItem:', updated);
    const index = this.openItems.findIndex(i => i.id === updated.id);
    if (index >= 0) {
      this.openItems[index] = updated;
      console.log('Local OpenItem updated at index:', index);
    } else {
      console.warn('OpenItem not found in local array for update:', updated.id);
    }
  }

  private formatDateForInput(date: Date | string | undefined | null): string {
    if (!date) return new Date().toISOString().split('T')[0];
    
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      return d.toISOString().split('T')[0];
    } catch (error) {
      console.warn('Fehler beim Formatieren des Datums:', date, error);
      return new Date().toISOString().split('T')[0];
    }
  }

  private handleError(message: string, err?: any): void {
    console.error(message, err);
    alert(message + (err?.error?.message ? ': ' + err.error.message : ''));
  }

  private showSuccessMessage(message: string): void {
    console.log('Success:', message);
    alert(message);
  }

  getCustomerById(customerId?: string): Customer | undefined {
    if (!customerId) return undefined;
    return this.customers[customerId];
  }

  // Data Loading
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

  // Permission checks
  canReceivePayment(openItem: OpenItem): boolean {
    return openItem.status === 'OPEN' || 
           openItem.status === 'PARTIALLY_PAID' ||
           openItem.status === 'OVERDUE';
  }

  canEditInvoice(invoice: Invoice): boolean {
    return invoice.status !== 'CANCELLED' && 
           invoice.status !== 'SENT' && 
           invoice.status !== 'DRAFT';
  }

  canEditOpenItem(openItem: OpenItem): boolean {
    return openItem.status !== 'PAID' && openItem.status !== 'CANCELLED';
  }

  // Quick Payment Helper Methods
  setFullPayment(): void {
    if (this.selectedOpenItemForPayment) {
      this.paymentAmount = this.selectedOpenItemForPayment.outstandingAmount || 0;
    }
  }

  setHalfPayment(): void {
    if (this.selectedOpenItemForPayment) {
      this.paymentAmount = Math.round((this.selectedOpenItemForPayment.outstandingAmount || 0) / 2 * 100) / 100;
    }
  }

  resetPayment(): void {
    this.paymentAmount = 0;
  }
}