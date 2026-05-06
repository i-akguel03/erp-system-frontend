import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SortPipe } from '../../shared/pipes/sort.pipe';
import { ListBase } from '../../shared/utils/list-base';
import { ListToolbarComponent } from '../../shared/components/list-toolbar/list-toolbar.component';
import { ListStatusComponent } from '../../shared/components/list-status/list-status.component';
import { Subscription, SubscriptionStatus, BillingCycle } from '../../models/Subscription';
import { SubscriptionService } from '../../services/subscription-service';
import { Contract } from '../../models/Contract';
import { ContractService } from '../../services/contract-service';
import { ProductService } from '../../services/product-service';
import { Product } from '../../models/Product';
import { ConfirmationService } from 'primeng/api';
import { NotificationService } from '../../services/notification.service';
import { Dialog } from 'primeng/dialog';

@Component({
  selector: 'app-subscription-list',
  standalone: true,
  imports: [CommonModule, FormsModule, Dialog, SortPipe, ListToolbarComponent, ListStatusComponent],
  templateUrl: './subscription-list.html',
  styleUrls: ['./subscription-list.scss'],
})
export class SubscriptionListComponent extends ListBase<Subscription> implements OnInit {
  subscriptions: Subscription[] = [];
  filteredSubscriptions: Subscription[] = [];

  contracts: Contract[] = [];
  products: Product[] = [];

  newSubscription: Subscription = this.createEmptySubscription();
  editSubscription: Subscription = this.createEmptySubscription();

  newStartDateString = '';
  newEndDateString = '';
  editStartDateString = '';
  editEndDateString = '';

  showPauseModal = false;
  subscriptionToPause: Subscription | null = null;

  constructor(
    private subscriptionService: SubscriptionService,
    private contractService: ContractService,
    private productService: ProductService,
    private confirmationService: ConfirmationService,
    private notification: NotificationService
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadContracts();
    this.loadProducts();
    this.loadSubscriptions();
  }

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

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: data => this.products = data,
      error: err => this.handleApiError(err, 'Fehler beim Laden der Produkte')
    });
  }

  filterSubscriptions(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredSubscriptions = this.subscriptions.filter(s => {
      const contract = this.getContractById(s.contractId);
      const contractString = contract ? `${contract.contractNumber} ${contract.contractTitle}` : '';
      return s.subscriptionNumber?.toLowerCase().includes(term) ||
             s.productName?.toLowerCase().includes(term) ||
             s.subscriptionStatus?.toLowerCase().includes(term) ||
             contractString.toLowerCase().includes(term);
    });
  }

  override openNewModal(): void {
    super.openNewModal();
    this.newSubscription = this.createEmptySubscription();
    this.newStartDateString = this.formatDateForInput(this.newSubscription.startDate);
    this.newEndDateString = '';
  }

  openEditModal(subscription: Subscription): void {
    this.editSubscription = { ...subscription };
    this.showEditModal = true;
    this.error = null;
    this.editStartDateString = this.formatDateForInput(subscription.startDate);
    this.editEndDateString = subscription.endDate ? this.formatDateForInput(subscription.endDate) : '';
  }

  createSubscription(): void {
    if (!this.newSubscription.contractId) { this.error = 'Bitte wählen Sie einen Vertrag aus.'; return; }
    if (!this.newSubscription.productId) { this.error = 'Bitte wählen Sie ein Produkt aus.'; return; }
    const selectedProduct = this.getProductById(this.newSubscription.productId);
    if (!selectedProduct) { this.error = 'Ausgewähltes Produkt existiert nicht.'; return; }

    const subscriptionToSend: Subscription = {
      ...this.newSubscription,
      productName: selectedProduct.name,
      startDate: new Date(this.newStartDateString),
      endDate: this.newEndDateString ? new Date(this.newEndDateString) : undefined,
    };
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
    if (!this.editSubscription.productId) { this.error = 'Bitte wählen Sie ein Produkt aus.'; return; }
    const selectedProduct = this.getProductById(this.editSubscription.productId);
    if (!selectedProduct) { this.error = 'Ausgewähltes Produkt existiert nicht.'; return; }

    const subscriptionToUpdate: Subscription = {
      ...this.editSubscription,
      productName: selectedProduct.name,
      startDate: new Date(this.editStartDateString),
      endDate: this.editEndDateString ? new Date(this.editEndDateString) : undefined
    };
    this.subscriptionService.updateSubscription(this.editSubscription.id, subscriptionToUpdate).subscribe({
      next: updated => { this.updateLocalSubscription(updated); this.closeEditModal(); },
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
    if (!id) return;
    this.confirmationService.confirm({
      message: 'Möchten Sie dieses Abonnement wirklich löschen?',
      header: 'Abonnement löschen',
      icon: 'pi pi-trash',
      acceptLabel: 'Löschen',
      rejectLabel: 'Abbrechen',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.subscriptionService.deleteSubscription(id).subscribe({
          next: () => {
            this.subscriptions = this.subscriptions.filter(s => s.id !== id);
            this.filterSubscriptions();
            this.notification.success('Abonnement wurde erfolgreich gelöscht.');
          },
          error: (err) => {
            if (err.status === 404) {
              this.notification.warn('Abonnement nicht gefunden (evtl. bereits gelöscht).');
            } else if (err.status === 409) {
              this.notification.error('Das Abonnement kann nicht gelöscht werden, da offene Fälligkeiten existieren.');
            } else {
              this.handleApiError(err, 'Fehler beim Löschen des Abos');
            }
          }
        });
      }
    });
  }

  private updateLocalSubscription(updated: Subscription): void {
    const index = this.subscriptions.findIndex(s => s.id === updated.id);
    if (index >= 0) {
      this.subscriptions[index] = updated;
      this.filteredSubscriptions = [...this.subscriptions];
    }
  }

  private createEmptySubscription(): Subscription {
    return {
      subscriptionNumber: '',
      productId: '',
      productName: '',
      startDate: new Date(),
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      billingCycle: BillingCycle.MONTHLY,
      contractId: '',
      autoRenewal: true
    };
  }

  private formatDateForInput(date: Date | undefined): string {
    if (!date) return '';
    return date instanceof Date ? date.toISOString().split('T')[0] : new Date(date).toISOString().split('T')[0];
  }

  getContractById(contractId?: string): Contract | undefined {
    return this.contracts.find(c => c.id === contractId);
  }

  getProductById(productId?: string): Product | undefined {
    return this.products.find(p => p.id === productId);
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
    return subscription.subscriptionStatus === SubscriptionStatus.PAUSED;
  }

  canPause(subscription: Subscription): boolean {
    return subscription.subscriptionStatus === SubscriptionStatus.ACTIVE;
  }

  canCancel(subscription: Subscription): boolean {
    return subscription.subscriptionStatus === SubscriptionStatus.ACTIVE ||
           subscription.subscriptionStatus === SubscriptionStatus.PAUSED;
  }
}
