import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SortPipe } from '../../../../../../shared/pipes/sort.pipe';
import { SortState } from '../../../../../../shared/utils/sort-state';
import { Invoice } from '../../../../../../models/Invoice';
import { Customer } from '../../../../../../models/Customer';

interface InvoiceActionEvent {
  action: string;
  invoice: Invoice;
}

@Component({
  selector: 'app-invoice-tab',
  standalone: true,
  imports: [CommonModule, SortPipe],
  templateUrl: './invoice-tab.html',
  styleUrls: ['./invoice-tab.scss']
})
export class InvoiceTabComponent {
  sort = new SortState();
  @Input() invoices: Invoice[] = [];
  @Input() customers: { [id: string]: Customer } = {};

  @Output() invoiceAction = new EventEmitter<InvoiceActionEvent>();

  // Modal State
  showDetailsModal = false;
  selectedInvoice: Invoice | null = null;

  // Modal Management
  openDetailsModal(invoice: Invoice): void {
    this.selectedInvoice = { ...invoice };
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedInvoice = null;
  }

  // Invoice Status Methods
  getInvoiceStatusBadgeClass(status: string): string {
    switch (status) {
      case 'DRAFT': return 'bg-secondary';
      case 'SENT': return 'bg-primary';
      case 'ACTIVE': return 'bg-success';
      case 'OVERDUE': return 'bg-danger';
      case 'CANCELLED': return 'bg-dark';
      default: return 'bg-light text-dark';
    }
  }

  getInvoiceStatusLabel(status: string): string {
    switch (status) {
      case 'DRAFT': return 'Entwurf';
      case 'SENT': return 'Versendet';
      case 'ACTIVE': return 'Aktiv';
      case 'OVERDUE': return 'Überfällig';
      case 'CANCELLED': return 'Storniert';
      default: return status;
    }
  }

  getStatusBadgeClass(status: string): string {
    return this.getInvoiceStatusBadgeClass(status);
  }

  canEditInvoice(invoice: Invoice): boolean {
    return invoice.status !== 'CANCELLED' && invoice.status !== 'SENT';
  }

  canSendInvoice(invoice: Invoice): boolean {
    return invoice.status === 'DRAFT' || invoice.status === 'ACTIVE';
  }

  canEdit(invoice: Invoice): boolean {
    return invoice.status !== 'CANCELLED';
  }

  canSend(invoice: Invoice): boolean {
    return invoice.status === 'DRAFT' || invoice.status === 'ACTIVE';
  }

  canCancel(invoice: Invoice): boolean {
    return invoice.status === 'DRAFT' || invoice.status === 'ACTIVE' || invoice.status === 'SENT';
  }

  canViewOpenItems(invoice: Invoice): boolean {
    return invoice.status === 'SENT';
  }

  // Event Handlers
  openInvoiceDetails(invoice: Invoice): void {
    this.openDetailsModal(invoice);
  }

  editInvoice(invoice: Invoice): void {
    if (!invoice) return;
    this.invoiceAction.emit({ action: 'edit', invoice: invoice });
  }

  sendInvoice(invoice: Invoice): void {
    if (!invoice) return;
    this.invoiceAction.emit({ action: 'send', invoice: invoice });
  }

  // Utility Methods
  getCustomerById(customerId?: string): Customer | undefined {
    if (!customerId) return undefined;
    return this.customers[customerId];
  }

  getDaysOverdue(dueDate: string | Date): number {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = now.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getTotalInvoiceAmount(): number {
    return this.invoices.reduce((total, invoice) => total + (invoice.totalAmount || 0), 0);
  }

  getPaidInvoiceAmount(): number {
    return this.invoices
      .filter(invoice => invoice.status === 'SENT')
      .reduce((total, invoice) => total + (invoice.totalAmount || 0), 0);
  }

  getOverdueInvoiceAmount(): number {
    return this.invoices
      .filter(invoice => invoice.status === 'DRAFT')
      .reduce((total, invoice) => total + (invoice.totalAmount || 0), 0);
  }

  // Helper Methods für Modal
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

  // Modal Actions
  openEditModalFromDetails(): void {
    if (this.selectedInvoice) {
      const invoiceToEdit = JSON.parse(JSON.stringify(this.selectedInvoice));
      this.closeDetailsModal();
      this.editInvoice(invoiceToEdit);
    } else {
      console.error('Keine selectedInvoice verfügbar für Bearbeitung');
    }
  }

  sendInvoiceFromDetails(): void {
    if (this.selectedInvoice) {
      const invoice = this.selectedInvoice;
      this.closeDetailsModal();
      this.sendInvoice(invoice);
    }
  }

  viewOpenItemsFromDetails(): void {
    if (this.selectedInvoice) {
      this.invoiceAction.emit({ action: 'viewOpenItems', invoice: this.selectedInvoice });
    }
  }

  cancelInvoiceFromDetails(): void {
    if (this.selectedInvoice) {
      this.invoiceAction.emit({ action: 'cancel', invoice: this.selectedInvoice });
      this.closeDetailsModal();
    }
  }

  deleteInvoiceFromDetails(): void {
    if (this.selectedInvoice) {
      this.invoiceAction.emit({ action: 'delete', invoice: this.selectedInvoice });
      this.closeDetailsModal();
    }
  }
}