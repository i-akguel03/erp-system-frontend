import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, SubscriptionStatus, BillingCycle } from '../../models/Subscription';
import { SubscriptionService } from '../../services/subscription-service';
import { Contract } from '../../models/Contract';
import { ContractService } from '../../services/contract-service';

@Component({
  selector: 'app-subscription-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subscription-list.html',
  styleUrls: ['./subscription-list.scss'],
})
export class SubscriptionListComponent implements OnInit {
  subscriptions: Subscription[] = [];
  filteredSubscriptions: Subscription[] = [];
  loading = false;
  error: string | null = null;
  searchTerm: string = '';

  contracts: Contract[] = [];

  newSubscription: Subscription = this.createEmptySubscription();
  editSubscription: Subscription = this.createEmptySubscription();

  newStartDateString: string = '';
  newEndDateString: string = '';
  editStartDateString: string = '';
  editEndDateString: string = '';

  showNewModal = false;
  showEditModal = false;
  showPauseModal = false;

  subscriptionToPause: Subscription | null = null;

  constructor(private subscriptionService: SubscriptionService,
              private contractService: ContractService) {}

  ngOnInit(): void {
    this.loadContracts();
    this.loadSubscriptions();
  }

  // --- Load Methods ---
  loadSubscriptions(): void {
    this.loading = true;
    this.error = null;
    this.subscriptionService.getSubscriptions(false).subscribe({
      next: data => {
        this.subscriptions = data;
        this.filteredSubscriptions = [...this.subscriptions];
        this.loading = false;
      },
      error: err => this.handleApiError(err, 'Fehler beim Laden der Abos')
    });
  }

  loadContracts(): void {
    this.contractService.getContracts().subscribe({
      next: data => this.contracts = data,
      error: err => this.handleApiError(err, 'Fehler beim Laden der Verträge')
    });
  }

  filterSubscriptions(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredSubscriptions = this.subscriptions.filter(s => {
      const contract = this.getContractById(s.contractId);
      const contractString = contract ? `${contract.contractNumber} ${contract.contractTitle}` : '';
      return s.subscriptionNumber.toLowerCase().includes(term) ||
             s.productName.toLowerCase().includes(term) ||
             s.subscriptionStatus.toLowerCase().includes(term) ||
             contractString.toLowerCase().includes(term);
    });
  }

  // --- Modal Management ---
  openNewModal(): void {
    this.showNewModal = true;
    this.error = null;
    this.newSubscription = this.createEmptySubscription();
    this.newStartDateString = this.formatDateForInput(this.newSubscription.startDate);
    this.newEndDateString = this.newSubscription.endDate ? this.formatDateForInput(this.newSubscription.endDate) : '';
  }

  closeNewModal(): void { this.showNewModal = false; }

  openEditModal(subscription: Subscription): void {
    this.editSubscription = { ...subscription };
    this.showEditModal = true;
    this.error = null;
    this.editStartDateString = this.formatDateForInput(subscription.startDate);
    this.editEndDateString = subscription.endDate ? this.formatDateForInput(subscription.endDate) : '';
  }

  closeEditModal(): void { this.showEditModal = false; }

  // --- CRUD ---
  createSubscription(): void {
    const subscriptionToSend = {
      ...this.newSubscription,
      startDate: new Date(this.newStartDateString),
      endDate: this.newEndDateString ? new Date(this.newEndDateString) : undefined
    };

    if (!subscriptionToSend.contractId) {
      this.error = 'Bitte wählen Sie einen Vertrag aus.';
      return;
    }

    this.subscriptionService.createSubscription(subscriptionToSend).subscribe({
      next: created => {
        this.subscriptions.push(created);
        this.filteredSubscriptions = [...this.subscriptions];
        this.closeNewModal();
      },
      error: err => this.handleApiError(err, 'Fehler beim Erstellen des Abos')
    });
  }

  updateSubscription(): void {
    if (!this.editSubscription.id) return;

    const subscriptionToUpdate = {
      ...this.editSubscription,
      startDate: new Date(this.editStartDateString),
      endDate: this.editEndDateString ? new Date(this.editEndDateString) : undefined
    };

    this.subscriptionService.updateSubscription(this.editSubscription.id, subscriptionToUpdate).subscribe({
      next: updated => {
        this.updateLocalSubscription(updated);
        this.closeEditModal();
      },
      error: err => this.handleApiError(err, 'Fehler beim Aktualisieren')
    });
  }

  activateSubscription(subscriptionId: string): void {
    this.subscriptionService.activateSubscription(subscriptionId).subscribe({
      next: updated => this.updateLocalSubscription(updated),
      error: err => this.handleApiError(err, 'Fehler beim Aktivieren')
    });
  }

  pauseSubscription(subscriptionId: string): void {
    this.subscriptionService.pauseSubscription(subscriptionId).subscribe({
      next: updated => this.updateLocalSubscription(updated),
      error: err => this.handleApiError(err, 'Fehler beim Pausieren')
    });
  }

  cancelSubscription(subscriptionId: string): void {
    this.subscriptionService.cancelSubscription(subscriptionId).subscribe({
      next: updated => this.updateLocalSubscription(updated),
      error: err => this.handleApiError(err, 'Fehler beim Kündigen')
    });
  }

  deleteSubscription(id?: string): void {
    if (!id || !confirm('Möchten Sie dieses Abo wirklich löschen?')) return;
    this.subscriptionService.deleteSubscription(id).subscribe({
      next: () => {
        this.subscriptions = this.subscriptions.filter(s => s.id !== id);
        this.filterSubscriptions();
      },
      error: err => this.handleApiError(err, 'Fehler beim Löschen des Abos')
    });
  }

  // --- Helper Methods ---
  private updateLocalSubscription(updated: Subscription): void {
    const index = this.subscriptions.findIndex(s => s.id === updated.id);
    if (index >= 0) {
      this.subscriptions[index] = updated;
      this.filteredSubscriptions = [...this.subscriptions];
    }
  }

  private handleApiError(err: any, defaultMessage: string): void {
    console.error(err);
    this.loading = false;
    this.error = err.error?.message || defaultMessage;
  }

  private createEmptySubscription(): Subscription {
    return {
      subscriptionNumber: '',
      productName: '',
      monthlyPrice: 0,
      startDate: new Date(),
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      billingCycle: BillingCycle.MONTHLY,
      contractId: ''
    };
  }

  private formatDateForInput(date: Date | undefined): string {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  }

  getContractById(contractId?: string): Contract | undefined {
    return this.contracts.find(c => c.id === contractId);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'bg-success';
      case 'PAUSED': return 'bg-warning';
      case 'CANCELLED': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  canActivate(subscription: Subscription): boolean {
    return subscription.subscriptionStatus === 'PAUSED';
  }

  canPause(subscription: Subscription): boolean {
    return subscription.subscriptionStatus === 'ACTIVE';
  }

  canCancel(subscription: Subscription): boolean {
    return subscription.subscriptionStatus === 'ACTIVE' || subscription.subscriptionStatus === 'PAUSED';
  }

  clearError(): void { this.error = null; }
}
