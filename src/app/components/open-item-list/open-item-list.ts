import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { OpenItem, OpenItemStatus, OpenItemStatistics } from '../../models/OpenItem';
import { Invoice } from '../../models/Invoice';
import { InvoiceService } from '../../services/invoice-service';
import { OpenItemService } from '../../services/open-item-service';

@Component({
  selector: 'app-openitem-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './open-item-list.html',
  styleUrls: ['./open-item-list.scss'],
})
export class OpenItemList implements OnInit {
  openItems: OpenItem[] = [];
  filteredOpenItems: OpenItem[] = [];
  loading = false;
  error: string | null = null;
  searchTerm: string = '';

  // Für neue/bearbeitete OpenItems
  availableInvoices: Invoice[] = [];
  newOpenItem: OpenItem = this.createEmptyOpenItem();
  editOpenItem: OpenItem = this.createEmptyOpenItem();
  newDueDateString: string = '';
  editDueDateString: string = '';

  // Zahlungs-Modal
  paymentOpenItem: OpenItem | null = null;
  paymentAmount: number = 0;
  paymentMethod: string = '';
  paymentReference: string = '';

  // Modal States
  showNewModal = false;
  showEditModal = false;
  showDetailsModal = false;
  showPaymentModal = false;
  selectedOpenItem: OpenItem | null = null;

  // Statistiken
  statistics: OpenItemStatistics | null = null;

  // Filter
  currentFilter: 'all' | 'open' | 'overdue' = 'all';

  constructor(
    private openItemService: OpenItemService,
    private invoiceService: InvoiceService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadOpenItems();
    this.loadAvailableInvoices();
    this.loadStatistics();

    // Check for query params (z.B. wenn von Rechnung navigiert)
    this.route.queryParams.subscribe(params => {
      if (params['invoiceId']) {
        this.filterByInvoice(params['invoiceId']);
      }
    });
  }

  // --- Load Methods ---
  loadOpenItems(): void {
    this.loading = true;
    this.error = null;
    
    this.openItemService.getAllOpenItems().subscribe({
      next: data => {
        console.log('Frontend erhält OpenItems:', data);
        this.openItems = data;
        this.applyCurrentFilter();
        this.loading = false;
      },
      error: err => this.handleApiError(err, 'Fehler beim Laden der offenen Posten')
    });
  }

  loadAvailableInvoices(): void {
    this.invoiceService.getAllInvoices().subscribe({
      next: data => {
        // Nur versendete Rechnungen ohne bestehende OpenItems
        this.availableInvoices = data.filter(invoice => 
          invoice.status === 'SENT' && 
          !this.openItems.some(item => item.invoiceId === invoice.id)
        );
      },
      error: err => console.error('Fehler beim Laden der Rechnungen:', err)
    });
  }

  loadStatistics(): void {
    Promise.all([
      this.openItemService.getTotalOutstandingAmount().toPromise(),
      this.openItemService.getTotalPaidAmount().toPromise(),
      this.openItemService.getOverdueItemCount().toPromise(),
      this.openItemService.getOpenItemCountByStatus('OPEN').toPromise()
    ]).then(([outstanding, paid, overdueCount, openCount]) => {
      this.statistics = {
        totalOutstanding: outstanding || 0,
        totalPaid: paid || 0,
        overdueCount: overdueCount || 0,
        openCount: openCount || 0,
        paidCount: 0, // Could add separate call if needed
        averageAmount: 0 // Could add separate call if needed
      };
    }).catch(err => {
      console.error('Fehler beim Laden der Statistiken:', err);
    });
  }

  // --- Filter Methods ---
  filterOpenItems(): void {
    const term = this.searchTerm.toLowerCase();
    let filtered = this.openItems.filter(item => 
      item.invoiceNumber?.toLowerCase().includes(term) ||
      item.customerName?.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term) ||
      item.status?.toLowerCase().includes(term)
    );

    // Apply current filter
    switch (this.currentFilter) {
      case 'open':
        filtered = filtered.filter(item => 
          item.status === 'OPEN' || item.status === 'PARTIALLY_PAID'
        );
        break;
      case 'overdue':
        filtered = filtered.filter(item => item.overdue);
        break;
    }

    this.filteredOpenItems = filtered;
  }

  applyCurrentFilter(): void {
    this.filterOpenItems();
  }

  showOverdueOnly(): void {
    this.currentFilter = 'overdue';
    this.applyCurrentFilter();
  }

  showOpenOnly(): void {
    this.currentFilter = 'open';
    this.applyCurrentFilter();
  }

  filterByInvoice(invoiceId: string): void {
    this.filteredOpenItems = this.openItems.filter(item => item.invoiceId === invoiceId);
  }

  // --- Modal Management ---
  openNewModal(): void {
    this.showNewModal = true;
    this.error = null;
    this.newOpenItem = this.createEmptyOpenItem();
    this.newDueDateString = this.formatDateForInput(new Date());
  }

  closeNewModal(): void { 
    this.showNewModal = false; 
  }

  openEditModal(openItem: OpenItem): void {
    this.editOpenItem = { ...openItem };
    this.showEditModal = true;
    this.error = null;
    this.editDueDateString = this.formatDateForInput(openItem.dueDate);
  }

  closeEditModal(): void { 
    this.showEditModal = false; 
  }

  openDetailsModal(openItem: OpenItem): void {
    this.selectedOpenItem = { ...openItem };
    this.showDetailsModal = true;
    this.error = null;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedOpenItem = null;
  }

  openPaymentModal(openItem: OpenItem): void {
    this.paymentOpenItem = { ...openItem };
    this.paymentAmount = openItem.outstandingAmount || 0;
    this.paymentMethod = '';
    this.paymentReference = '';
    this.showPaymentModal = true;
    this.error = null;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.paymentOpenItem = null;
    this.paymentAmount = 0;
    this.paymentMethod = '';
    this.paymentReference = '';
  }

  // --- CRUD Operations ---
  createOpenItem(): void {
    const openItemToSend: OpenItem = {
      ...this.newOpenItem,
      dueDate: this.newDueDateString ? new Date(this.newDueDateString) : new Date()
    };

    if (!openItemToSend.invoiceId || !openItemToSend.description || !openItemToSend.amount) {
      this.error = 'Bitte füllen Sie alle Pflichtfelder aus.';
      return;
    }

    this.openItemService.createOpenItem(openItemToSend).subscribe({
      next: created => {
        this.openItems.push(created);
        this.applyCurrentFilter();
        this.loadStatistics();
        this.closeNewModal();
      },
      error: err => this.handleApiError(err, 'Fehler beim Erstellen des offenen Postens')
    });
  }

  updateOpenItem(): void {
    if (!this.editOpenItem.id) return;

    const openItemToUpdate: OpenItem = {
      ...this.editOpenItem,
      dueDate: this.editDueDateString ? new Date(this.editDueDateString) : new Date()
    };

    if (!openItemToUpdate.description || !openItemToUpdate.amount) {
      this.error = 'Bitte füllen Sie alle Pflichtfelder aus.';
      return;
    }

    this.openItemService.updateOpenItem(this.editOpenItem.id, openItemToUpdate).subscribe({
      next: updated => {
        this.updateLocalOpenItem(updated);
        this.loadStatistics();
      },
      error: err => this.handleApiError(err, 'Fehler beim Aktualisieren des offenen Postens')
    });
  }

  // --- Payment Operations ---
  recordPayment(): void {
    if (!this.paymentOpenItem?.id || !this.paymentAmount || this.paymentAmount <= 0) {
      this.error = 'Bitte geben Sie einen gültigen Zahlungsbetrag ein.';
      return;
    }

    if (this.paymentAmount > (this.paymentOpenItem.outstandingAmount || 0)) {
      this.error = 'Der Zahlungsbetrag darf den ausstehenden Betrag nicht überschreiten.';
      return;
    }

    this.openItemService.recordPayment(
      this.paymentOpenItem.id, 
      this.paymentAmount, 
      this.paymentMethod || undefined, 
      this.paymentReference || undefined
    ).subscribe({
      next: updated => {
        this.updateLocalOpenItem(updated);
        this.loadStatistics();
        this.closePaymentModal();
      },
      error: err => this.handleApiError(err, 'Fehler beim Buchen der Zahlung')
    });
  }

  // --- Status Operations ---
  addReminder(openItemId: string): void {
    if (!openItemId) return;
    
    this.openItemService.addReminder(openItemId).subscribe({
      next: updated => {
        this.updateLocalOpenItem(updated);
        alert('Mahnung wurde hinzugefügt.');
      },
      error: err => this.handleApiError(err, 'Fehler beim Hinzufügen der Mahnung')
    });
  }

  cancelOpenItem(openItemId: string): void {
    if (!openItemId || !confirm('Möchten Sie diesen offenen Posten wirklich stornieren?')) return;
    
    this.openItemService.cancelOpenItem(openItemId).subscribe({
      next: updated => {
        this.updateLocalOpenItem(updated);
        this.loadStatistics();
      },
      error: err => this.handleApiError(err, 'Fehler beim Stornieren des offenen Postens')
    });
  }

  // --- Helper Methods ---
  private updateLocalOpenItem(updated: OpenItem): void {
    const index = this.openItems.findIndex(item => item.id === updated.id);
    if (index >= 0) {
      this.openItems[index] = updated;
      this.applyCurrentFilter();
    }
    if (this.showEditModal) {
      this.closeEditModal();
    }
  }

  private handleApiError(err: any, defaultMessage: string): void {
    console.error('API Error:', err);
    this.loading = false;
    this.error = err.error?.message || defaultMessage;
  }

  private createEmptyOpenItem(): OpenItem {
    return {
      status: OpenItemStatus.OPEN,
      paidAmount: 0,
      reminderCount: 0
    };
  }

  private formatDateForInput(date: Date | string | undefined | null): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  }

  // --- UI Helper Methods ---
  getStatusLabel(status: OpenItemStatus): string {
    switch (status) {
      case OpenItemStatus.OPEN: return 'Offen';
      case OpenItemStatus.PARTIALLY_PAID: return 'Teilweise bezahlt';
      case OpenItemStatus.PAID: return 'Bezahlt';
      case OpenItemStatus.CANCELLED: return 'Storniert';
      case OpenItemStatus.OVERDUE: return 'Überfällig';
      default: return status;
    }
  }

  getStatusBadgeClass(status: OpenItemStatus): string {
    switch (status) {
      case OpenItemStatus.OPEN: return 'bg-warning';
      case OpenItemStatus.PARTIALLY_PAID: return 'bg-info';
      case OpenItemStatus.PAID: return 'bg-success';
      case OpenItemStatus.CANCELLED: return 'bg-secondary';
      case OpenItemStatus.OVERDUE: return 'bg-danger';
      default: return 'bg-light';
    }
  }

  getDaysOverdue(openItem: OpenItem): number {
    if (!openItem.dueDate || !openItem.overdue) return 0;
    const today = new Date();
    const dueDate = new Date(openItem.dueDate);
    const diffTime = today.getTime() - dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isNearDue(openItem: OpenItem): boolean {
    if (!openItem.dueDate || openItem.overdue) return false;
    const today = new Date();
    const dueDate = new Date(openItem.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 7 && daysUntilDue >= 0;
  }

  // --- Permission Checks ---
  canReceivePayment(openItem: OpenItem): boolean {
    return openItem.status === OpenItemStatus.OPEN || 
           openItem.status === OpenItemStatus.PARTIALLY_PAID ||
           openItem.status === OpenItemStatus.OVERDUE;
  }

  canEdit(openItem: OpenItem): boolean {
    return openItem.status !== OpenItemStatus.PAID && 
           openItem.status !== OpenItemStatus.CANCELLED;
  }

  canCancel(openItem: OpenItem): boolean {
    return openItem.status === OpenItemStatus.OPEN || 
           openItem.status === OpenItemStatus.OVERDUE ||
           openItem.status === OpenItemStatus.PARTIALLY_PAID;
  }

  canAddReminder(openItem: OpenItem): boolean {
    return openItem.status === OpenItemStatus.OPEN || 
           openItem.status === OpenItemStatus.OVERDUE ||
           openItem.status === OpenItemStatus.PARTIALLY_PAID;
  }

  clearError(): void { 
    this.error = null; 
  }
}