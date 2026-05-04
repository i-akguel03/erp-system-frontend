import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import { Contract } from '../../models/Contract';
import { Subscription } from '../../models/Subscription';
import { Customer } from '../../models/Customer';
import { OpenItem } from '../../models/OpenItem';
import { Invoice } from '../../models/Invoice';

import { ContractService } from '../../services/contract-service';
import { CustomerService } from '../../services/customer-service';
import { SubscriptionService } from '../../services/subscription-service';
import { InvoiceService } from '../../services/invoice-service';
import { ConfirmationService } from 'primeng/api';
import { NotificationService } from '../../services/notification.service';

import { SubscriptionPanelComponent } from './components/subscription-panel/subscription-panel';
import { FinancialTabsComponent } from './components/financial-tabs/financial-tabs';
import { ContractListComponent } from './components/contract-list/contract-list';

interface ContractActionEvent {
  action: 'neu' | 'edit' | 'duplicate' | 'kündigen' | 'stornieren';
  contract: Contract;
}

interface InvoiceActionEvent {
  action: 'edit' | 'send' | 'details';
  invoice: Invoice;
}

interface OpenItemActionEvent {
  action: 'payment' | 'reminder' | 'details' | 'edit' | 'cancel';
  openItem: OpenItem;
}

interface MobilePanelState {
  contracts: 'collapsed' | 'expanded' | 'normal';
  subscriptions: 'collapsed' | 'expanded' | 'normal';
  financial: 'collapsed' | 'expanded' | 'normal';
}

@Component({
  selector: 'app-contract-center',
  standalone: true,
  imports: [
    CommonModule,
    ContractListComponent,
    SubscriptionPanelComponent,
    FinancialTabsComponent
  ],
  templateUrl: './contract-center.html',
  styleUrls: ['./contract-center.scss']
})
export class ContractCenterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data properties
  contracts: Contract[] = [];
  selectedContract: Contract | null = null;
  subscriptions: Subscription[] = [];
  selectedSubscription: Subscription | null = null;
  customers: { [id: string]: Customer } = {};

  // UI state
  loading: boolean = false;
  error: string | null = null;

  // Mobile state management - FIXED: Added navigation stack
  isMobile = false;
  mobileCurrentView: 'contracts' | 'subscriptions' | 'financial' = 'contracts';
  mobileNavigationStack: Array<'contracts' | 'subscriptions' | 'financial'> = ['contracts']; // NEW: Navigation history

  constructor(
    private contractService: ContractService,
    private customerService: CustomerService,
    private subscriptionService: SubscriptionService,
    private invoiceService: InvoiceService,
    private confirmationService: ConfirmationService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.checkMobileView();
    this.updateBodyScrollLock();
    this.loadCustomers();
    this.loadContracts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Restore body scroll on destroy
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkMobileView();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapePress(event: KeyboardEvent) {
    if (this.isMobile) {
      this.navigateBack();
    }
  }

  // Mobile detection and management
  private checkMobileView() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 768;

    if (wasMobile !== this.isMobile) {
      this.updateBodyScrollLock();

      if (!this.isMobile) {
        // Reset mobile view when switching to desktop
        this.mobileCurrentView = 'contracts';
        this.mobileNavigationStack = ['contracts']; // FIXED: Reset navigation stack
      }
    }
  }

  private updateBodyScrollLock() {
    if (typeof document === 'undefined') return;

    if (this.isMobile) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
  }

  // FIXED: Added method to navigate to a mobile view with stack management
  private navigateToMobileView(view: 'contracts' | 'subscriptions' | 'financial'): void {
    if (!this.isMobile) return;

    this.mobileCurrentView = view;

    if (this.mobileNavigationStack[this.mobileNavigationStack.length - 1] !== view) {
      this.mobileNavigationStack.push(view);
    }
  }

  // Mobile navigation methods
  getMobileNavTitle(): string {
    switch (this.mobileCurrentView) {
      case 'contracts':
        return 'Verträge';
      case 'subscriptions':
        return 'Abonnements';
      case 'financial':
        return 'Finanzdetails';
      default:
        return 'Navigation';
    }
  }

  navigateBack(): void {
    if (!this.isMobile || this.mobileNavigationStack.length <= 1) return;

    this.mobileNavigationStack.pop();
    const previousView = this.mobileNavigationStack[this.mobileNavigationStack.length - 1];
    this.mobileCurrentView = previousView;

    if (previousView === 'contracts') {
      this.selectedContract = null;
      this.selectedSubscription = null;
      this.subscriptions = [];
    } else if (previousView === 'subscriptions') {
      this.selectedSubscription = null;
    }
  }

  resetToContracts(): void {
    if (!this.isMobile) return;

    this.mobileCurrentView = 'contracts';
    this.mobileNavigationStack = ['contracts']; // Reset stack
    this.selectedContract = null;
    this.selectedSubscription = null;
    this.subscriptions = [];
  }

  // NEW: Method to check if back navigation is possible
  canNavigateBack(): boolean {
    return this.isMobile && this.mobileNavigationStack.length > 1;
  }

  // FIXED: Improved breadcrumb with better logic
  getMobileBreadcrumb(): string[] {
    const breadcrumb: string[] = [];

    if (this.mobileCurrentView === 'contracts') {
      return breadcrumb; // No breadcrumb on root view
    }

    // Always start with Verträge when not on contracts view
    breadcrumb.push('Verträge');

    // Add contract title if selected and not on subscriptions view
    if (this.selectedContract && this.mobileCurrentView !== 'subscriptions') {
      breadcrumb.push(this.selectedContract.contractNumber || this.selectedContract.contractTitle || 'Vertrag');
    }

    // Add current view
    if (this.mobileCurrentView === 'subscriptions') {
      breadcrumb.push('Abonnements');
    } else if (this.mobileCurrentView === 'financial') {
      if (this.selectedSubscription) {
        breadcrumb.push(this.selectedSubscription.productName || 'Abonnement');
      }
      breadcrumb.push('Finanzdetails');
    }

    return breadcrumb;
  }

  // Data loading methods
  private loadCustomers(): void {
    this.customerService.getCustomers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: customers => {
          this.customers = {};
          customers.forEach(c => {
            if (c.id) this.customers[c.id] = c;
          });
        },
        error: err => {
          console.error('Fehler beim Laden der Kunden:', err);
          this.error = 'Fehler beim Laden der Kunden.';
        }
      });
  }

  private loadContracts(): void {
    this.loading = true;
    this.error = null;

    this.contractService.getContracts(false)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: contracts => {
          this.contracts = contracts;
          this.loading = false;
        },
        error: err => {
          console.error('Fehler beim Laden der Verträge:', err);
          this.error = 'Fehler beim Laden der Verträge.';
          this.loading = false;
        }
      });
  }

  private loadSubscriptions(contractId: string): void {
    this.subscriptionService.getSubscriptionsByContract(contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: subs => {
          this.subscriptions = subs;
        },
        error: err => {
          console.error('Fehler beim Laden der Abonnements:', err);
          this.subscriptions = [];
        }
      });
  }

  // Event handlers - FIXED: Using new navigation method
  onContractSelected(contract: Contract): void {
    if (this.selectedContract?.id === contract.id && !this.isMobile) return;

    this.selectedContract = contract;
    this.subscriptions = [];
    this.selectedSubscription = null;

    // FIXED: Use proper navigation method for mobile
    if (this.isMobile) {
      this.navigateToMobileView('subscriptions');
    }

    this.loadSubscriptions(contract.id!);
  }

  onSubscriptionSelected(subscription: Subscription): void {
    if (this.selectedSubscription?.id === subscription.id && !this.isMobile) return;

    this.selectedSubscription = subscription;

    if (this.isMobile) {
      this.navigateToMobileView('financial');
    }
  }

  onContractAction(event: ContractActionEvent): void {
    const { action, contract } = event;

    switch (action) {
      case 'neu':
        this.createNewContract();
        break;
      case 'edit':
        this.editContract(contract);
        break;
      case 'duplicate':
        this.duplicateContract(contract);
        break;
      case 'kündigen':
        this.terminateContract(contract);
        break;
      case 'stornieren':
        this.cancelContract(contract);
        break;
    }
  }

  onInvoiceAction(event: InvoiceActionEvent): void {
    const { action, invoice } = event;

    switch (action) {
      case 'edit':
        this.editInvoice(invoice);
        break;
      case 'send':
        this.sendInvoice(invoice);
        break;
      case 'details':
        this.openInvoiceDetails(invoice);
        break;
    }
  }

  onOpenItemAction(event: OpenItemActionEvent): void {
    const { action, openItem } = event;

    switch (action) {
      case 'payment':
        this.processPayment(openItem);
        break;
      case 'reminder':
        this.sendReminder(openItem);
        break;
      case 'details':
        this.openOpenItemDetails(openItem);
        break;
      case 'edit':
        this.editOpenItem(openItem);
        break;
      case 'cancel':
        this.cancelOpenItem(openItem);
        break;
    }
  }

  // Contract action methods — werden in einer späteren Iteration implementiert
  private createNewContract(): void {}

  private editContract(_contract: Contract): void {}

  private duplicateContract(_contract: Contract): void {}

  private terminateContract(contract: Contract): void {
    this.confirmationService.confirm({
      message: `Möchten Sie den Vertrag "${contract.contractTitle}" wirklich kündigen?`,
      header: 'Vertrag kündigen',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Kündigen',
      rejectLabel: 'Abbrechen',
      accept: () => {
        // TODO: contractService.terminateContract(contract.id)
      }
    });
  }

  private cancelContract(contract: Contract): void {
    this.confirmationService.confirm({
      message: `Möchten Sie den Vertrag "${contract.contractTitle}" wirklich stornieren?`,
      header: 'Vertrag stornieren',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Stornieren',
      rejectLabel: 'Abbrechen',
      accept: () => {
        // TODO: contractService.cancelContract(contract.id)
      }
    });
  }

  // Invoice action methods
  private editInvoice(_invoice: Invoice): void {}

  private sendInvoice(invoice: Invoice): void {
    if (!invoice.id) return;

    this.invoiceService.sendInvoice(invoice.id).subscribe({
      next: () => this.notificationService.success('Rechnung wurde versendet'),
      error: err => {
        this.error = 'Fehler beim Senden der Rechnung.';
        this.notificationService.error('Fehler beim Senden der Rechnung');
        console.error(err);
      }
    });
  }

  private openInvoiceDetails(_invoice: Invoice): void {}

  // OpenItem action methods
  private processPayment(_openItem: OpenItem): void {}

  private sendReminder(_openItem: OpenItem): void {}

  private openOpenItemDetails(_openItem: OpenItem): void {}

  private editOpenItem(_openItem: OpenItem): void {}

  private cancelOpenItem(openItem: OpenItem): void {
    if (!openItem.id) return;

    this.confirmationService.confirm({
      message: 'Möchten Sie diesen offenen Posten wirklich stornieren?',
      header: 'Posten stornieren',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Stornieren',
      rejectLabel: 'Abbrechen',
      accept: () => {
        // TODO: openItemService.cancelOpenItem(openItem.id)
      }
    });
  }
}