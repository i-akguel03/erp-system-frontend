// invoice-details-modal.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Customer } from '../../../../models/Customer';
import { Invoice } from '../../../../services/testservice';


@Component({
  selector: 'app-invoice-details-modal',
  templateUrl: './invoice-details-modal.html',
  styleUrls: ['./invoice-details-modal.scss']
})
export class InvoiceDetailsModal {
  @Input() invoice: Invoice | null = null;
  @Input() customer: Customer | undefined;
  
  @Output() close = new EventEmitter<void>();
  @Output() action = new EventEmitter<{type: string, invoice: Invoice}>();

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onAction(type: string): void {
    if (this.invoice) {
      this.action.emit({ type, invoice: this.invoice });
    }
  }

  // Invoice Methods - aus bestehender Logik  
  getInvoiceStatusBadgeClass(status: string): string {
    switch (status) {
      case 'DRAFT': return 'bg-secondary';
      case 'SENT': return 'bg-primary';
      case 'PAID': return 'bg-success';
      case 'OVERDUE': return 'bg-danger';
      case 'CANCELLED': return 'bg-dark';
      default: return 'bg-light';
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

  formatDate(date: string | Date): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('de-DE');
  }

  formatCurrency(amount: number): string {
    if (amount == null) return '-';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }
}