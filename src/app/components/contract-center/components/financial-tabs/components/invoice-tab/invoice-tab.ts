import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Invoice } from '../../../../../../models/Invoice';
import { Customer } from '../../../../../../models/Customer';



interface InvoiceActionEvent {
  action: string;
  invoice: Invoice;
}

@Component({
  selector: 'app-invoice-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-tab.html',
  styleUrls: ['./invoice-tab.scss']
})
export class InvoiceTabComponent {
  @Input() invoices: Invoice[] = [];
  @Input() customers: { [id: string]: Customer } = {};

  @Output() invoiceAction = new EventEmitter<InvoiceActionEvent>();

  // Invoice Status Methods
  getInvoiceStatusBadgeClass(status: string): string {
    switch (status) {
      case 'DRAFT': return 'bg-secondary';
      case 'SENT': return 'bg-primary';
      case 'PAID': return 'bg-success';
      case 'OVERDUE': return 'bg-danger';
      case 'CANCELLED': return 'bg-dark';
      default: return 'bg-light text-dark';
    }
  }

  getInvoiceStatusLabel(status: string): string {
    switch (status) {
      case 'DRAFT': return 'Entwurf';
      case 'SENT': return 'Versendet';
      case 'PAID': return 'Bezahlt';
      case 'OVERDUE': return 'Überfällig';
      case 'CANCELLED': return 'Storniert';
      default: return status;
    }
  }

  canEditInvoice(invoice: Invoice): boolean {
    return invoice.status !== 'CANCELLED' && invoice.status !== 'SENT';
  }

  canSendInvoice(invoice: Invoice): boolean {
    return invoice.status === 'DRAFT';
  }

  // Event Handlers
  openInvoiceDetails(invoice: Invoice): void {
    this.invoiceAction.emit({ action: 'details', invoice });
  }

  editInvoice(invoice: Invoice): void {
    this.invoiceAction.emit({ action: 'edit', invoice });
  }

  sendInvoice(invoice: Invoice): void {
    this.invoiceAction.emit({ action: 'send', invoice });
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
}