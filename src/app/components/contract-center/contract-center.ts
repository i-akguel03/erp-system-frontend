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

import { SubscriptionPanelComponent } from './components/subscription-panel/subscription-panel';
import { FinancialTabsComponent } from './components/financial-tabs/financial-tabs';
import { ContractListComponent } from './components/contract-list/contract-list';

interface ContractActionEvent {
  action: string;
  contract: Contract;
}

interface InvoiceActionEvent {
  action: string;
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

  // Mobile state management
  isMobile = false;
  mobileCurrentView: 'contracts' | 'subscriptions' | 'financial' = 'contracts';

  constructor(
    private contractService: ContractService,
    private customerService: CustomerService,
    private subscriptionService: SubscriptionService,
    private invoiceService: InvoiceService
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

  // Mobile navigation methods
  getMobileNavTitle(): string {
    switch (this.mobileCurrentView) {
      case 'contracts':
        return 'Verträge';
      case 'subscriptions':
        return `Abonnements von ${this.selectedContract?.contractTitle || 'Vertrag'}`;
      case 'financial':
        return `Finanzdetails von ${this.selectedSubscription?.productName || this.selectedContract?.contractTitle || 'Auswahl'}`;
      default:
        return 'Navigation';
    }
  }

  navigateBack(): void {
    if (!this.isMobile) return;

    console.log('Navigate back from:', this.mobileCurrentView);

    switch (this.mobileCurrentView) {
      case 'financial':
        this.mobileCurrentView = 'subscriptions';
        break;
      case 'subscriptions':
        this.mobileCurrentView = 'contracts';
        break;
      case 'contracts':
        // Already at root
        break;
    }

    console.log('Navigated to:', this.mobileCurrentView);
  }

  resetToContracts(): void {
    if (!this.isMobile) return;

    console.log('Reset to contracts view');
    this.mobileCurrentView = 'contracts';
  }

  getMobileBreadcrumb(): string[] {
    const breadcrumb: string[] = [];

    if (this.mobileCurrentView === 'contracts') {
      return breadcrumb;
    }

    breadcrumb.push('Verträge');

    if (this.selectedContract && this.mobileCurrentView !== 'subscriptions') {
      breadcrumb.push(this.selectedContract.contractTitle || 'Vertrag');
    }

    if (this.selectedSubscription && this.mobileCurrentView === 'financial') {
      breadcrumb.push(this.selectedSubscription.productName || 'Abonnement');
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

          // Mobile: Navigate to subscriptions view
          if (this.isMobile) {
            console.log('Subscriptions loaded, navigating to subscriptions view');
            this.mobileCurrentView = 'subscriptions';
          }
        },
        error: err => {
          console.error('Fehler beim Laden der Abonnements:', err);
          this.subscriptions = [];
        }
      });
  }

  // Event handlers
  onContractSelected(contract: Contract): void {
    if (this.selectedContract?.id === contract.id) return;

    console.log('Contract selected:', contract.contractTitle);

    this.selectedContract = contract;
    this.subscriptions = [];
    this.selectedSubscription = null;

    this.loadSubscriptions(contract.id!);
  }

  onSubscriptionSelected(subscription: Subscription): void {
    if (this.selectedSubscription?.id === subscription.id) return;

    console.log('Subscription selected:', subscription.productName);

    this.selectedSubscription = subscription;

    // Mobile: Navigate to financial details
    if (this.isMobile) {
      console.log('Mobile: Navigating to financial view');
      this.mobileCurrentView = 'financial';
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

  // Contract action methods
  private createNewContract(): void {
    console.log('Neuen Vertrag erstellen');
  }

  private editContract(contract: Contract): void {
    console.log('Vertrag bearbeiten:', contract);
  }

  private duplicateContract(contract: Contract): void {
    console.log('Vertrag duplizieren:', contract);
  }

  private terminateContract(contract: Contract): void {
    if (confirm(`Möchten Sie den Vertrag "${contract.contractTitle}" wirklich kündigen?`)) {
      console.log('Vertrag kündigen:', contract);
    }
  }

  private cancelContract(contract: Contract): void {
    if (confirm(`Möchten Sie den Vertrag "${contract.contractTitle}" wirklich stornieren?`)) {
      console.log('Vertrag stornieren:', contract);
    }
  }

  // Invoice action methods
  private editInvoice(invoice: Invoice): void {
    console.log('Rechnung bearbeiten:', invoice);
  }

  private sendInvoice(invoice: Invoice): void {
    if (!invoice.id) return;

    this.invoiceService.sendInvoice(invoice.id).subscribe({
      next: (updatedInvoice) => {
        console.log('Rechnung erfolgreich gesendet:', updatedInvoice);
      },
      error: err => {
        console.error('Fehler beim Senden der Rechnung:', err);
        this.error = 'Fehler beim Senden der Rechnung.';
      }
    });
  }

  private openInvoiceDetails(invoice: Invoice): void {
    console.log('Rechnungsdetails öffnen:', invoice);
  }

  // OpenItem action methods
  private processPayment(openItem: OpenItem): void {
    console.log('Zahlung verarbeiten:', openItem);
  }

  private sendReminder(openItem: OpenItem): void {
    if (!openItem.id) return;
    console.log('Mahnung senden:', openItem);
  }

  private openOpenItemDetails(openItem: OpenItem): void {
    console.log('OpenItem Details öffnen:', openItem);
  }

  private editOpenItem(openItem: OpenItem): void {
    console.log('OpenItem bearbeiten:', openItem);
  }

  private cancelOpenItem(openItem: OpenItem): void {
    if (!openItem.id) return;

    if (confirm('Möchten Sie diesen offenen Posten wirklich stornieren?')) {
      console.log('OpenItem stornieren:', openItem);
    }
  }
}