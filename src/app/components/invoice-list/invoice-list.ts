import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Customer } from '../../models/Customer';
import { CustomerService } from '../../services/customer-service';
import { Invoice } from '../../models/Invoice';
import { InvoiceService } from '../../services/invoice-service';
import { EmailService } from '../../services/email.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-list.html',
  styleUrls: ['./invoice-list.scss'],
})
export class InvoiceListComponent implements OnInit {
  invoices: Invoice[] = [];
  filteredInvoices: Invoice[] = [];
  loading = false;
  error: string | null = null;
  searchTerm: string = '';

  customers: Customer[] = [];

  newInvoice: Invoice = this.createEmptyInvoice();
  editInvoice: Invoice = this.createEmptyInvoice();

  newInvoiceDateString: string = '';
  newDueDateString: string = '';
  editInvoiceDateString: string = '';
  editDueDateString: string = '';

  showNewModal = false;
  showEditModal = false;
  showDetailsModal = false;
  selectedInvoice: Invoice | null = null;

  saving = false;
  emailSendingId: string | null = null;

  constructor(
    private invoiceService: InvoiceService,
    private customerService: CustomerService,
    private router: Router,
    private emailService: EmailService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
    this.loadInvoices();
  }

  // --- Load Methods ---
  // Ersetzen Sie die loadInvoices() Methode in Ihrer InvoiceListComponent:

loadInvoices(): void {
  this.loading = true;
  this.error = null;
  this.invoiceService.getAllInvoices().subscribe({
    next: data => {
      console.log('Frontend erhält Rechnungen:', data); // Debug-Log
      
      this.invoices = data;
      this.filteredInvoices = [...this.invoices];
      
      // Debug: Items pro Rechnung loggen
      this.invoices.forEach(invoice => {
        console.log(`Rechnung ${invoice.invoiceNumber}: ${invoice.invoiceItems?.length || 0} Items`, invoice.invoiceItems);
      });
      
      this.loading = false;
    },
    error: err => this.handleApiError(err, 'Fehler beim Laden der Rechnungen')
  });
}

// Zusätzliche Debug-Methode hinzufügen:
debugInvoiceItems(invoice: Invoice): void {
  console.log('Debug Invoice Items für:', invoice.invoiceNumber);
  console.log('Items Array:', invoice.invoiceItems);
  console.log('Items Length:', invoice.invoiceItems?.length || 0);
  if (invoice.invoiceItems && invoice.invoiceItems.length > 0) {
    invoice.invoiceItems.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, item);
    });
  }
}

// Methode für Items-Gesamtsumme hinzufügen:
getTotalItemsAmount(invoice: Invoice): number {
  if (!invoice.invoiceItems || invoice.invoiceItems.length === 0) {
    return 0;
  }
  return invoice.invoiceItems.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
}

// Items-Anzahl anzeigen:
getItemsCount(invoice: Invoice): number {
  return invoice.invoiceItems?.length || 0;
}

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: data => this.customers = data,
      error: err => this.handleApiError(err, 'Fehler beim Laden der Kunden')
    });
  }

  filterInvoices(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredInvoices = this.invoices.filter(i => {
      const customer = this.getCustomerById(i.customerId);
      const customerString = customer ? `${customer.firstName} ${customer.lastName} ${customer.customerNumber}` : '';
      return (i.invoiceNumber?.toLowerCase().includes(term)) ||
             (i.status?.toLowerCase().includes(term)) ||
             customerString.toLowerCase().includes(term);
    });
  }

  deleteInvoice(id?: string): void {
    if (!id || !confirm('Möchten Sie diese Rechnung wirklich löschen?')) return;
    this.invoiceService.deleteInvoice(id).subscribe({
      next: () => {
        this.invoices = this.invoices.filter(i => i.id !== id);
        this.filterInvoices();
      },
      error: err => this.handleApiError(err, 'Fehler beim Löschen der Rechnung')
    });
  }

  // --- Modal Management ---
  openNewModal(): void {
    this.showNewModal = true;
    this.error = null;
    this.newInvoice = this.createEmptyInvoice();
    this.newInvoiceDateString = this.formatDateForInput(this.newInvoice.invoiceDate);
    this.newDueDateString = this.formatDateForInput(this.newInvoice.dueDate);
  }

  closeNewModal(): void { this.showNewModal = false; }

  openEditModal(invoice: Invoice): void {
    this.editInvoice = { ...invoice };
    this.showEditModal = true;
    this.error = null;
    this.editInvoiceDateString = this.formatDateForInput(invoice.invoiceDate);
    this.editDueDateString = this.formatDateForInput(invoice.dueDate);
  }

  closeEditModal(): void { this.showEditModal = false; }

  openDetailsModal(invoice: Invoice): void {
    this.selectedInvoice = { ...invoice };
    this.showDetailsModal = true;
    this.error = null;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedInvoice = null;
  }

  openEditFromDetails(): void {
    if (!this.selectedInvoice) return;
    const invoice = this.selectedInvoice;
    this.closeDetailsModal();
    this.openEditModal(invoice);
  }

  sendFromDetails(): void {
    if (!this.selectedInvoice?.id) return;
    const id = this.selectedInvoice.id;
    this.closeDetailsModal();
    this.sendInvoice(id);
  }

  cancelFromDetails(): void {
    if (!this.selectedInvoice?.id) return;
    const id = this.selectedInvoice.id;
    this.closeDetailsModal();
    this.cancelInvoice(id);
  }

  deleteFromDetails(): void {
    if (!this.selectedInvoice?.id) return;
    const id = this.selectedInvoice.id;
    this.closeDetailsModal();
    this.deleteInvoice(id);
  }

  viewOpenItemsFromDetails(): void {
    if (!this.selectedInvoice) return;
    const invoice = this.selectedInvoice;
    this.closeDetailsModal();
    this.viewOpenItems(invoice);
  }

  // --- CRUD Operations ---
  createInvoice(): void {
    const invoiceToSend: Invoice = {
      ...this.newInvoice,
      invoiceDate: this.newInvoiceDateString ? new Date(this.newInvoiceDateString) : new Date(),
      dueDate: this.newDueDateString ? new Date(this.newDueDateString) : undefined
    };

    if (!invoiceToSend.customerId || invoiceToSend.customerId.trim() === '') {
      this.error = 'Bitte wählen Sie einen Kunden aus.';
      return;
    }

    if (this.saving) return;
    this.saving = true;
    this.invoiceService.createInvoice(invoiceToSend).subscribe({
      next: created => {
        this.saving = false;
        this.invoices.push(created);
        this.filteredInvoices = [...this.invoices];
        this.closeNewModal();
        this.notification.success('Rechnung erfolgreich erstellt.');
      },
      error: err => { this.handleApiError(err, 'Fehler beim Erstellen der Rechnung'); this.notification.error('Fehler beim Erstellen der Rechnung.'); }
    });
  }

  updateInvoice(): void {
    if (!this.editInvoice.id) return;

    const invoiceToUpdate: Invoice = {
      ...this.editInvoice,
      invoiceDate: this.editInvoiceDateString ? new Date(this.editInvoiceDateString) : new Date(),
      dueDate: this.editDueDateString ? new Date(this.editDueDateString) : undefined
    };

    if (!invoiceToUpdate.customerId || invoiceToUpdate.customerId.trim() === '') {
      this.error = 'Bitte wählen Sie einen Kunden aus.';
      return;
    }

    if (this.saving) return;
    this.saving = true;
    this.invoiceService.updateInvoice(this.editInvoice.id, invoiceToUpdate).subscribe({
      next: updated => { this.saving = false; this.updateLocalInvoice(updated); this.notification.success('Rechnung erfolgreich aktualisiert.'); },
      error: err => { this.handleApiError(err, 'Fehler beim Aktualisieren der Rechnung'); this.notification.error('Fehler beim Aktualisieren der Rechnung.'); }
    });
  }

  // --- Status Changes ---
  sendInvoice(invoiceId: string): void {
    if (!invoiceId) return;
    this.invoiceService.sendInvoice(invoiceId).subscribe({
      next: updated => {
        this.updateLocalInvoice(updated);
        this.notification.success('Rechnung erfolgreich versendet.');
      },
      error: err => {
        this.handleApiError(err, 'Fehler beim Senden der Rechnung');
        this.notification.error(this.error || 'Fehler beim Senden der Rechnung.');
      }
    });
  }

  cancelInvoice(invoiceId: string): void {
    if (!invoiceId) return;
    this.invoiceService.cancelInvoice(invoiceId).subscribe({
      next: updated => {
        this.updateLocalInvoice(updated);
        this.notification.success('Rechnung erfolgreich storniert.');
      },
      error: err => {
        this.handleApiError(err, 'Fehler beim Stornieren der Rechnung');
        this.notification.error(this.error || 'Fehler beim Stornieren der Rechnung.');
      }
    });
  }

  // --- Invoice Run Generation ---
  generateInvoiceRun(): void {
    if (!confirm('Möchten Sie einen Rechnungslauf generieren? Dies erstellt Open Items aus den versendeten Rechnungen.')) {
      return;
    }

    this.loading = true;
    this.error = null;

    // Hier würden Sie Ihren InvoiceRunService aufrufen
    // this.invoiceRunService.generateInvoiceRun().subscribe({
    //   next: (result) => {
    //     this.loading = false;
    //     alert(`Rechnungslauf erfolgreich generiert! ${result.openItemsCreated} Open Items erstellt.`);
    //   },
    //   error: err => this.handleApiError(err, 'Fehler beim Generieren des Rechnungslaufs')
    // });

    // Placeholder für Demo
    setTimeout(() => {
      this.loading = false;
      alert('Rechnungslauf erfolgreich generiert! Open Items wurden erstellt.');
    }, 1000);
  }

  // --- Navigation to Open Items ---
  viewOpenItems(invoice: Invoice): void {
    if (!invoice.id) return;
    // Navigation zu Open Items für diese Rechnung
    this.router.navigate(['/open-items'], { 
      queryParams: { invoiceId: invoice.id } 
    });
  }

  viewAllOpenItems(): void {
    this.router.navigate(['/open-items']);
  }

  // --- Helper Methods ---
  private updateLocalInvoice(updated: Invoice): void {
    const index = this.invoices.findIndex(i => i.id === updated.id);
    if (index >= 0) {
      this.invoices[index] = updated;
      this.filteredInvoices = [...this.invoices];
    }
    if (this.showEditModal) {
      this.closeEditModal();
    }
  }

  private handleApiError(err: any, defaultMessage: string): void {
    console.error('API Error:', err);
    this.loading = false;
    this.saving = false;
    this.error = err.error?.message || defaultMessage;
  }

  private createEmptyInvoice(): Invoice {
    return { 
      status: 'DRAFT',
      invoiceItems: [],
      customerId: ''
    };
  }

  private formatDateForInput(date: Date | string | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  }

  getCustomerById(customerId?: string): Customer | undefined {
    return this.customers.find(c => c.id === customerId);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'DRAFT': return 'bg-secondary';
      case 'SENT': return 'bg-primary';
      case 'ACTIVE': return 'bg-success';
      case 'OVERDUE': return 'bg-danger';
      case 'CANCELLED': return 'bg-dark';
      default: return 'bg-light text-dark';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'DRAFT': return 'Entwurf';
      case 'SENT': return 'Versendet';
      case 'ACTIVE': return 'Aktiv';
      case 'OVERDUE': return 'Überfällig';
      case 'CANCELLED': return 'Storniert';
      default: return status;
    }
  }

  canSend(invoice: Invoice): boolean {
    return invoice.status === 'DRAFT';
  }

  canCancel(invoice: Invoice): boolean {
    return invoice.status === 'DRAFT' || invoice.status === 'SENT';
  }

  canEdit(invoice: Invoice): boolean {
    return invoice.status !== 'CANCELLED';
  }

  canViewOpenItems(invoice: Invoice): boolean {
    // Open Items können nur für versendete Rechnungen angezeigt werden
    return invoice.status === 'SENT';
  }

  hasOpenItems(invoice: Invoice): boolean {
    // Diese Logik müsste je nach Ihrer Implementierung angepasst werden
    // Eventuell haben Sie ein Flag in der Invoice oder müssen das über den Service prüfen
    return invoice.status === 'SENT';
  }

  clearError(): void { this.error = null; }

  getInvoiceTypeLabel(type: string): string {
    switch (type) {
      case 'MANUAL': return 'Manuell';
      case 'AUTO_GENERATED': return 'Auto-generiert';
      case 'RECURRING': return 'Wiederkehrend';
      case 'CREDIT_NOTE': return 'Gutschrift';
      default: return type;
    }
  }

  getItemTypeLabel(type: string): string {
    switch (type) {
      case 'SERVICE': return 'Dienstleistung';
      case 'PRODUCT': return 'Produkt';
      case 'SUBSCRIPTION': return 'Abonnement';
      case 'DISCOUNT': return 'Rabatt';
      case 'FEE': return 'Gebühr';
      default: return type;
    }
  }

  getItemTypeBadgeClass(type: string): string {
    switch (type) {
      case 'SERVICE': return 'bg-primary';
      case 'PRODUCT': return 'bg-success';
      case 'SUBSCRIPTION': return 'bg-info';
      case 'DISCOUNT': return 'bg-warning';
      case 'FEE': return 'bg-secondary';
      default: return 'bg-light';
    }
  }

  getNetAmount(item: any): number {
    const baseAmount = item.quantity * item.unitPrice;
    const discount = item.discountAmount || 0;
    return baseAmount - discount;
  }

  sendInvoiceEmail(invoice: Invoice): void {
    if (!invoice.id || this.emailSendingId === invoice.id) return;
    this.emailSendingId = invoice.id;
    this.emailService.sendInvoiceEmail(invoice.id).subscribe({
      next: () => { this.notification.success('Rechnungs-E-Mail gesendet.'); this.emailSendingId = null; },
      error: () => { this.notification.error('E-Mail konnte nicht gesendet werden.'); this.emailSendingId = null; }
    });
  }
}