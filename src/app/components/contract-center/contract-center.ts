import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Dialog } from 'primeng/dialog';

import { Contract } from '../../models/Contract';
import { Subscription } from '../../models/Subscription';
import { Customer } from '../../models/Customer';
import { OpenItem } from '../../models/OpenItem';
import { Invoice } from '../../models/Invoice';

import { ContractService } from '../../services/contract-service';
import { CustomerService } from '../../services/customer-service';
import { SubscriptionService } from '../../services/subscription-service';
import { InvoiceService } from '../../services/invoice-service';
import { ProductService } from '../../services/product-service';
import { ConfirmationService } from 'primeng/api';
import { NotificationService } from '../../services/notification.service';
import { Product } from '../../models/Product';
import { BillingCycle } from '../../models/Subscription';

import { SubscriptionPanelComponent } from './components/subscription-panel/subscription-panel';
import { FinancialTabsComponent } from './components/financial-tabs/financial-tabs';
import { ContractListComponent } from './components/contract-list/contract-list';

interface ContractActionEvent {
  action: 'neu' | 'edit' | 'duplicate' | 'kündigen' | 'stornieren' | 'verlängern';
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

@Component({
  selector: 'app-contract-center',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Dialog,
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
  renewalBatchLoading = false;

  // Resize state
  topPanelPercent = 60;
  isResizing = false;
  private resizeStartY = 0;
  private resizeStartPercent = 0;
  private resizeContainerHeight = 0;
  private readonly RESIZE_MIN = 20;
  private readonly RESIZE_MAX = 80;

  // Contract modal state
  showContractModal = false;
  contractModalTitle = '';
  contractModalMode: 'create' | 'edit' | 'duplicate' = 'create';
  contractForm: Partial<Contract> = {};
  contractStartDateString = '';
  contractEndDateString = '';
  contractModalLoading = false;

  get customersArray(): Customer[] {
    return Object.values(this.customers);
  }

  // Mobile state management - FIXED: Added navigation stack
  isMobile = false;
  mobileCurrentView: 'contracts' | 'subscriptions' | 'financial' = 'contracts';
  mobileNavigationStack: Array<'contracts' | 'subscriptions' | 'financial'> = ['contracts']; // NEW: Navigation history

  // Subscription modal state
  showSubscriptionModal = false;
  subscriptionForm: Partial<Subscription> = {};
  subscriptionStartDateString = '';
  subscriptionEndDateString = '';
  subscriptionModalLoading = false;
  products: Product[] = [];
  readonly billingCycleOptions: { label: string; value: BillingCycle }[] = [
    { label: 'Monatlich',        value: BillingCycle.MONTHLY },
    { label: 'Vierteljährlich',  value: BillingCycle.QUARTERLY },
    { label: 'Halbjährlich',     value: BillingCycle.SEMI_ANNUALLY },
    { label: 'Jährlich',         value: BillingCycle.ANNUALLY },
  ];

  constructor(
    private el: ElementRef,
    private contractService: ContractService,
    private customerService: CustomerService,
    private subscriptionService: SubscriptionService,
    private invoiceService: InvoiceService,
    private productService: ProductService,
    private confirmationService: ConfirmationService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.checkMobileView();
    this.updateBodyScrollLock();
    this.loadCustomers();
    this.loadContracts();
    this.loadProducts();
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

  @HostListener('window:resize')
  onResize(): void {
    this.checkMobileView();
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.isMobile) {
      this.navigateBack();
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isResizing) return;
    const delta = event.clientY - this.resizeStartY;
    const deltaPercent = (delta / this.resizeContainerHeight) * 100;
    this.topPanelPercent = Math.min(
      this.RESIZE_MAX,
      Math.max(this.RESIZE_MIN, this.resizeStartPercent + deltaPercent)
    );
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.isResizing = false;
  }

  startResize(event: MouseEvent): void {
    event.preventDefault();
    const container = this.el.nativeElement.querySelector('.desktop-split-container') as HTMLElement;
    this.resizeContainerHeight = container?.clientHeight ?? 600;
    this.isResizing = true;
    this.resizeStartY = event.clientY;
    this.resizeStartPercent = this.topPanelPercent;
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

  private navigateToMobileView(view: 'contracts' | 'subscriptions' | 'financial'): void {
    if (!this.isMobile) return;
    this.mobileCurrentView = view;
    if (this.mobileNavigationStack[this.mobileNavigationStack.length - 1] !== view) {
      this.mobileNavigationStack.push(view);
    }
  }

  mobileNavigateTo(view: 'subscriptions' | 'financial'): void {
    if (!this.selectedContract) return;
    this.mobileCurrentView = view;
    this.mobileNavigationStack = view === 'subscriptions'
      ? ['contracts', 'subscriptions']
      : ['contracts', 'subscriptions', 'financial'];
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

  loadContracts(): void {
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
          this.error = err.error?.message || `Fehler beim Laden der Verträge (HTTP ${err.status}).`;
          this.loading = false;
        }
      });
  }

  private loadProducts(): void {
    this.productService.getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: products => { this.products = products; },
        error: err => console.error('Fehler beim Laden der Produkte:', err)
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

  onCreateSubscription(): void {
    this.openSubscriptionModal();
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
      case 'verlängern':
        this.renewContract(contract);
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

  // --- Contract Modal ---

  openContractModal(mode: 'create' | 'edit' | 'duplicate', contract?: Contract): void {
    this.contractModalMode = mode;
    this.contractModalLoading = false;

    if (mode === 'create') {
      this.contractModalTitle = 'Neuen Vertrag erstellen';
      this.contractForm = { contractStatus: 'DRAFT' };
      this.contractStartDateString = new Date().toISOString().split('T')[0];
      this.contractEndDateString = '';
    } else if (mode === 'edit' && contract) {
      this.contractModalTitle = 'Vertrag bearbeiten';
      this.contractForm = { ...contract };
      this.contractStartDateString = this.formatDateForInput(contract.startDate);
      this.contractEndDateString = this.formatDateForInput(contract.endDate);
    } else if (mode === 'duplicate' && contract) {
      this.contractModalTitle = 'Vertrag duplizieren';
      this.contractForm = {
        contractTitle: `${contract.contractTitle} (Kopie)`,
        customerId: contract.customerId,
        contractStatus: 'DRAFT',
      };
      this.contractStartDateString = new Date().toISOString().split('T')[0];
      this.contractEndDateString = '';
    }

    this.showContractModal = true;
  }

  closeContractModal(): void {
    this.showContractModal = false;
    this.contractForm = {};
    this.contractModalLoading = false;
  }

  saveContract(): void {
    if (!this.contractForm.contractTitle?.trim() || !this.contractForm.customerId) {
      this.notificationService.warn('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    const contract: Contract = {
      ...this.contractForm,
      startDate: this.contractStartDateString || undefined,
      endDate: this.contractEndDateString || undefined,
    };

    this.contractModalLoading = true;

    if (this.contractModalMode === 'edit' && contract.id) {
      this.contractService.updateContract(contract.id, contract)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: updated => {
            const idx = this.contracts.findIndex(c => c.id === updated.id);
            if (idx >= 0) this.contracts[idx] = updated;
            if (this.selectedContract?.id === updated.id) this.selectedContract = updated;
            this.closeContractModal();
            this.notificationService.success('Vertrag wurde aktualisiert');
          },
          error: err => {
            this.contractModalLoading = false;
            this.notificationService.error('Fehler beim Aktualisieren des Vertrags');
            console.error(err);
          }
        });
    } else {
      this.contractService.createContract(contract)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: created => {
            this.contracts = [created, ...this.contracts];
            this.closeContractModal();
            const verb = this.contractModalMode === 'duplicate' ? 'dupliziert' : 'erstellt';
            this.notificationService.success(`Vertrag wurde ${verb}`);
          },
          error: err => {
            this.contractModalLoading = false;
            this.notificationService.error('Fehler beim Speichern des Vertrags');
            console.error(err);
          }
        });
    }
  }

  private formatDateForInput(date?: string | Date): string {
    if (!date) return '';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  // --- Contract Actions ---

  private createNewContract(): void {
    this.openContractModal('create');
  }

  private editContract(contract: Contract): void {
    this.openContractModal('edit', contract);
  }

  private duplicateContract(contract: Contract): void {
    this.openContractModal('duplicate', contract);
  }

  private terminateContract(contract: Contract): void {
    if (!contract.id) return;
    this.confirmationService.confirm({
      message: `Möchten Sie den Vertrag "${contract.contractTitle}" wirklich kündigen?`,
      header: 'Vertrag kündigen',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Kündigen',
      rejectLabel: 'Abbrechen',
      accept: () => {
        this.contractService.terminateContract(contract.id!)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: updated => {
              this.updateLocalContract(updated);
              this.notificationService.success(`Vertrag "${contract.contractTitle}" wurde gekündigt`);
            },
            error: err => {
              this.notificationService.error('Fehler beim Kündigen des Vertrags');
              console.error(err);
            }
          });
      }
    });
  }

  private cancelContract(contract: Contract): void {
    if (!contract.id) return;
    this.confirmationService.confirm({
      message: `Möchten Sie den Vertrag "${contract.contractTitle}" wirklich stornieren? Diese Aktion kann nicht rückgängig gemacht werden.`,
      header: 'Vertrag stornieren',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Stornieren',
      rejectLabel: 'Abbrechen',
      accept: () => {
        this.contractService.terminateContract(contract.id!)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: updated => {
              this.updateLocalContract(updated);
              this.notificationService.success(`Vertrag "${contract.contractTitle}" wurde storniert`);
            },
            error: err => {
              this.notificationService.error('Fehler beim Stornieren des Vertrags');
              console.error(err);
            }
          });
      }
    });
  }

  private renewContract(contract: Contract): void {
    if (!contract.id) return;
    this.confirmationService.confirm({
      message: `Möchten Sie den Vertrag "${contract.contractTitle}" verlängern?`,
      header: 'Vertrag verlängern',
      icon: 'pi pi-refresh',
      acceptLabel: 'Verlängern',
      rejectLabel: 'Abbrechen',
      accept: () => {
        this.contractService.renewContract(contract.id!)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: result => {
              if (result?.renewedContract) {
                this.updateLocalContract(result.renewedContract);
              } else {
                this.loadContracts();
              }
              this.notificationService.success(`Vertrag "${contract.contractTitle}" wurde verlängert`);
            },
            error: err => {
              this.notificationService.error('Fehler beim Verlängern des Vertrags');
              console.error(err);
            }
          });
      }
    });
  }

  runRenewalBatch(): void {
    this.renewalBatchLoading = true;
    this.contractService.runRenewalBatch()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          this.renewalBatchLoading = false;
          const count = result?.renewedCount ?? result?.processed ?? '?';
          this.notificationService.success(`Verlängerungslauf abgeschlossen — ${count} Vertrag/Verträge verlängert`);
          this.loadContracts();
        },
        error: err => {
          this.renewalBatchLoading = false;
          this.notificationService.error('Fehler beim Verlängerungslauf');
          console.error(err);
        }
      });
  }

  private updateLocalContract(updated: Contract): void {
    const idx = this.contracts.findIndex(c => c.id === updated.id);
    if (idx >= 0) this.contracts[idx] = updated;
    if (this.selectedContract?.id === updated.id) this.selectedContract = updated;
  }

  // --- Subscription Modal ---

  openSubscriptionModal(): void {
    if (!this.selectedContract?.id) {
      this.notificationService.warn('Bitte wählen Sie zuerst einen Vertrag aus.');
      return;
    }
    this.subscriptionForm = {
      contractId: this.selectedContract.id,
      billingCycle: BillingCycle.MONTHLY,
      autoRenewal: false,
    };
    this.subscriptionStartDateString = new Date().toISOString().split('T')[0];
    this.subscriptionEndDateString = '';
    this.subscriptionModalLoading = false;
    this.showSubscriptionModal = true;
  }

  closeSubscriptionModal(): void {
    this.showSubscriptionModal = false;
    this.subscriptionForm = {};
    this.subscriptionModalLoading = false;
  }

  saveSubscription(): void {
    if (!this.subscriptionForm.productId || !this.subscriptionForm.billingCycle || !this.subscriptionStartDateString) {
      this.notificationService.warn('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    const selectedProduct = this.products.find(p => p.id === this.subscriptionForm.productId);
    const subscription: Subscription = {
      contractId: this.selectedContract!.id!,
      productId: this.subscriptionForm.productId!,
      productName: selectedProduct?.name,
      billingCycle: this.subscriptionForm.billingCycle!,
      startDate: new Date(this.subscriptionStartDateString),
      endDate: this.subscriptionEndDateString ? new Date(this.subscriptionEndDateString) : undefined,
      autoRenewal: this.subscriptionForm.autoRenewal ?? false,
    };

    this.subscriptionModalLoading = true;
    this.subscriptionService.createSubscription(subscription)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: created => {
          this.subscriptions = [...this.subscriptions, created];
          this.closeSubscriptionModal();
          this.notificationService.success('Abonnement wurde erstellt');
        },
        error: err => {
          this.subscriptionModalLoading = false;
          this.notificationService.error('Fehler beim Erstellen des Abonnements');
          console.error(err);
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