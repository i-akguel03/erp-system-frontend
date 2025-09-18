// invoice-details-modal.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Customer } from '../../../../models/Customer';
import { Invoice } from '../../../../models/Invoice';

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
    console.log('Modal Action:', type, this.invoice); // Debug-Ausgabe
    if (this.invoice) {
      this.action.emit({ type, invoice: this.invoice });
    }
  }

  // Status Badge Methoden
  getInvoiceStatusBadgeClass(status?: string): string {
    if (!status) return 'bg-light text-dark';
    switch (status) {
      case 'DRAFT': return 'bg-secondary';
      case 'SENT': return 'bg-primary';
      case 'PAID': return 'bg-success';
      case 'OVERDUE': return 'bg-danger';
      case 'CANCELLED': return 'bg-dark';
      default: return 'bg-light text-dark';
    }
  }

  getInvoiceStatusLabel(status?: string): string {
    if (!status) return 'Unbekannt';
    switch (status) {
      case 'DRAFT': return 'Entwurf';
      case 'SENT': return 'Versendet';
      case 'PAID': return 'Bezahlt';
      case 'OVERDUE': return 'Überfällig';
      case 'CANCELLED': return 'Storniert';
      default: return status;
    }
  }

  // Item Type Methoden
  getItemTypeLabel(type?: string): string {
    if (!type) return 'Unbekannt';
    switch (type) {
      case 'SERVICE': return 'Dienstleistung';
      case 'PRODUCT': return 'Produkt';
      case 'SUBSCRIPTION': return 'Abonnement';
      case 'DISCOUNT': return 'Rabatt';
      case 'FEE': return 'Gebühr';
      default: return type;
    }
  }

  getItemTypeBadgeClass(type?: string): string {
    if (!type) return 'bg-light text-dark';
    switch (type) {
      case 'SERVICE': return 'bg-primary';
      case 'PRODUCT': return 'bg-success';
      case 'SUBSCRIPTION': return 'bg-info';
      case 'DISCOUNT': return 'bg-warning';
      case 'FEE': return 'bg-secondary';
      default: return 'bg-light text-dark';
    }
  }

  // Permission Methoden
  canEditInvoice(invoice: Invoice | null): boolean {
    if (!invoice) return false;
    return invoice.status !== 'CANCELLED' && 
           invoice.status !== 'SENT' && 
           invoice.status !== 'DRAFT';
  }

  canSendInvoice(invoice: Invoice | null): boolean {
    if (!invoice) return false;
    return invoice.status === 'DRAFT';
  }

  canCancelInvoice(invoice: Invoice | null): boolean {
    if (!invoice) return false;
    return invoice.status === 'DRAFT' || 
           invoice.status === 'SENT';
  }

  canDeleteInvoice(invoice: Invoice | null): boolean {
    if (!invoice) return false;
    return invoice.status === 'DRAFT' || 
           invoice.status === 'CANCELLED';
  }

  // Berechnung Methoden
  getNetAmount(item: any): number {
    if (!item) return 0;
    const baseAmount = (item.quantity || 0) * (item.unitPrice || 0);
    const discount = item.discountAmount || 0;
    return baseAmount - discount;
  }

  // Formatierung Methoden
  formatDate(date: string | Date | undefined | null): string {
    if (!date) return '-';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('de-DE');
    } catch {
      return '-';
    }
  }

  formatCurrency(amount: number | undefined | null): string {
    if (amount == null || isNaN(amount)) return '-';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }
}