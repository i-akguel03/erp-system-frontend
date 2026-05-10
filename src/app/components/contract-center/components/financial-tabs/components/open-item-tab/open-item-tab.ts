import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SortPipe } from '../../../../../../shared/pipes/sort.pipe';
import { SortState } from '../../../../../../shared/utils/sort-state';
import { OpenItem, OpenItemStatus } from '../../../../../../models/OpenItem';
import { Customer } from '../../../../../../models/Customer';
import { ConfirmationService } from 'primeng/api';

interface OpenItemActionEvent {
  action: 'payment' | 'reminder' | 'details' | 'edit' | 'cancel';
  openItem: OpenItem;
}

@Component({
  selector: 'app-open-items-tab',
  standalone: true,
  imports: [CommonModule, SortPipe],
  templateUrl: './open-item-tab.html',
  styleUrls: ['./open-item-tab.scss']
})
export class OpenItemsTabComponent implements OnChanges {
  sort = new SortState();
  constructor(private confirmationService: ConfirmationService) {}
  @Input() openItems: OpenItem[] = [];
  @Input() customers: { [id: string]: Customer } = {};
  @Input() selectedSubscriptionId: string | null = null;
  
  @Output() openItemAction = new EventEmitter<OpenItemActionEvent>();

  // Modal State
  showDetailsModal = false;
  selectedOpenItem: OpenItem | null = null;

  ngOnChanges(changes: SimpleChanges): void {

  }

  // Modal Management
  openDetailsModal(openItem: OpenItem): void {
    this.selectedOpenItem = { ...openItem };
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedOpenItem = null;
  }

  // Gefilterte OpenItems basierend auf Subscription
  get filteredOpenItems(): OpenItem[] {
    if (!this.openItems || this.openItems.length === 0) {
      return [];
    }
    
    // Da alle Verknüpfungsfelder undefined sind, nehmen wir an, 
    // dass das Backend bereits gefilterte Daten liefert
    return this.openItems;
  }

  // Status Badge Methoden
  getOpenItemStatusBadgeClass(status: OpenItemStatus): string {
    switch (status) {
      case OpenItemStatus.OPEN: return 'bg-warning text-dark';
      case OpenItemStatus.PARTIALLY_PAID: return 'bg-primary';
      case OpenItemStatus.PAID: return 'bg-success';
      case OpenItemStatus.CANCELLED: return 'bg-secondary';
      case OpenItemStatus.OVERDUE: return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getOpenItemStatusLabel(status: OpenItemStatus): string {
    switch (status) {
      case OpenItemStatus.OPEN: return 'Offen';
      case OpenItemStatus.PARTIALLY_PAID: return 'Teilweise bezahlt';
      case OpenItemStatus.PAID: return 'Bezahlt';
      case OpenItemStatus.CANCELLED: return 'Storniert';
      case OpenItemStatus.OVERDUE: return 'Überfällig';
      default: return status || 'Unbekannt';
    }
  }

  // Alias für Template-Kompatibilität
  getStatusBadgeClass(status: OpenItemStatus): string {
    return this.getOpenItemStatusBadgeClass(status);
  }

  getStatusLabel(status: OpenItemStatus): string {
    return this.getOpenItemStatusLabel(status);
  }

  // Datumsberechnungen
  getDaysOverdue(openItem: OpenItem): number {
    if (!openItem.dueDate || !openItem.overdue) return 0;
    const due = new Date(openItem.dueDate);
    const now = new Date();
    const diffTime = now.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getOverdueWarningClass(overdueDays: number): string {
    if (overdueDays <= 7) return 'text-warning';
    if (overdueDays <= 30) return 'text-danger';
    return 'text-danger fw-bold';
  }

  getDueDateWarningClass(openItem: OpenItem): string {
    if (openItem.overdue) return 'text-danger';
    if (this.isNearDue(openItem)) return 'text-warning';
    return 'text-success';
  }

  getDueDateIcon(openItem: OpenItem): string {
    if (openItem.status === OpenItemStatus.PAID) return 'fas fa-check-circle text-success';
    if (openItem.status === OpenItemStatus.CANCELLED) return 'fas fa-times-circle text-secondary';
    if (openItem.overdue) return 'fas fa-exclamation-triangle text-danger';
    if (this.isNearDue(openItem)) return 'fas fa-clock text-warning';
    return 'fas fa-calendar text-primary';
  }

  isNearDue(openItem: OpenItem): boolean {
    if (!openItem.dueDate || openItem.overdue) return false;
    const today = new Date();
    const dueDate = new Date(openItem.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 7 && daysUntilDue >= 0;
  }

  // Hilfsmethoden
  getCustomerById(customerId?: string): Customer | undefined {
    if (!customerId) return undefined;
    return this.customers[customerId];
  }

  // Statistik-Methoden
  getTotalOpenAmount(): number {
    const result = this.filteredOpenItems.reduce((total, item) => total + (item.outstandingAmount || 0), 0);
    console.log('🔍 Total open amount:', result);
    return result;
  }

  getOverdueAmount(): number {
    return this.filteredOpenItems
      .filter(item => item.overdue)
      .reduce((total, item) => total + (item.outstandingAmount || 0), 0);
  }

  getPaidAmount(): number {
    return this.filteredOpenItems.reduce((total, item) => total + (item.paidAmount || 0), 0);
  }

  getTotalAmount(): number {
    return this.filteredOpenItems.reduce((total, item) => total + (item.amount || 0), 0);
  }

  // Action Methods - Details direkt öffnen
  onDetails(openItem: OpenItem): void {
    console.log('Open Details for:', openItem);
    this.openDetailsModal(openItem);
  }

  onPayment(openItem: OpenItem): void {
    console.log('Payment Action for:', openItem);
    this.openItemAction.emit({ action: 'payment', openItem });
  }

  onReminder(openItem: OpenItem): void {
    this.openItemAction.emit({ action: 'reminder', openItem });
  }

  onEdit(openItem: OpenItem): void {
    this.openItemAction.emit({ action: 'edit', openItem });
  }

  onCancel(openItem: OpenItem): void {
    this.confirmationService.confirm({
      message: 'Möchten Sie diesen offenen Posten wirklich stornieren?',
      header: 'Posten stornieren',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Stornieren',
      rejectLabel: 'Abbrechen',
      accept: () => this.openItemAction.emit({ action: 'cancel', openItem })
    });
  }

  // Permission Checks
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

  // Modal Actions für Footer
  onPaymentFromDetails(): void {
    if (this.selectedOpenItem) {
      const openItemForPayment = { ...this.selectedOpenItem };
      this.closeDetailsModal();
      this.onPayment(openItemForPayment);
    }
  }

  onEditFromDetails(): void {
    if (this.selectedOpenItem) {
      const openItemToEdit = { ...this.selectedOpenItem };
      this.closeDetailsModal();
      this.onEdit(openItemToEdit);
    }
  }

  onReminderFromDetails(): void {
    if (this.selectedOpenItem) {
      const openItemForReminder = { ...this.selectedOpenItem };
      this.closeDetailsModal();
      this.onReminder(openItemForReminder);
    }
  }

  onCancelFromDetails(): void {
    if (this.selectedOpenItem) {
      const openItemForCancel = { ...this.selectedOpenItem };
      this.confirmationService.confirm({
        message: 'Möchten Sie diesen offenen Posten wirklich stornieren?',
        header: 'Posten stornieren',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Stornieren',
        rejectLabel: 'Abbrechen',
        accept: () => {
          this.closeDetailsModal();
          this.openItemAction.emit({ action: 'cancel', openItem: openItemForCancel });
        }
      });
    }
  }

  // Math für Template
  Math = Math;

  // DEBUG: Zusätzliche Debug-Methode für Template
  debugLog(message: string, data?: any): void {
    console.log(`🔍 Template Debug - ${message}:`, data);
  }
}