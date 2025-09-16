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
  template: `
    <div class="component-container" [class.mobile-view]="isMobile">
      
      <!-- Mobile Backdrop -->
      <div class="mobile-backdrop" 
           [class.show]="hasExpandedPanel"
           (click)="collapseAllPanels()"></div>
      
      <!-- Oben: Vertragsliste -->
      <div class="contract-list">
        <div class="card" 
             [class.mobile-collapsed]="isMobile && mobilePanelState.contracts === 'collapsed'"
             [class.mobile-expanded]="isMobile && mobilePanelState.contracts === 'expanded'">
          
          <div class="card-header" 
               (click)="toggleMobilePanel('contracts')"
               [class.clickable]="isMobile">
            <div class="card-title">
              <i class="fas fa-file-contract me-2"></i>
              Verträge
              <span class="badge bg-primary ms-2" *ngIf="contracts?.length">
                {{ contracts.length }}
              </span>
            </div>
            <i class="fas fa-chevron-down collapse-indicator mobile-only"
               [class.collapsed]="mobilePanelState.contracts === 'collapsed'"></i>
          </div>
          
          <div class="card-body">
            <app-contract-list
              [contracts]="contracts"
              [customers]="customers"
              [loading]="loading"
              [error]="error"
              [selectedContract]="selectedContract"
              (contractSelected)="onContractSelected($event)"
              (contractAction)="onContractAction($event)">
            </app-contract-list>
          </div>
        </div>
      </div>

      <!-- Unten: Abos & Finanzdetails -->
      <div class="bottom-row">
        
        <!-- Abonnements Panel -->
        <div class="subscription-section">
          <div class="card"
               [class.mobile-collapsed]="isMobile && mobilePanelState.subscriptions === 'collapsed'"
               [class.mobile-expanded]="isMobile && mobilePanelState.subscriptions === 'expanded'">
            
            <div class="card-header" 
                 (click)="toggleMobilePanel('subscriptions')"
                 [class.clickable]="isMobile">
              <div class="card-title">
                <i class="fas fa-sync-alt me-2"></i>
                Abonnements
                <span class="badge bg-info ms-2" *ngIf="subscriptions?.length">
                  {{ subscriptions.length }}
                </span>
                <span class="badge bg-secondary ms-1" *ngIf="selectedContract && !subscriptions?.length">
                  Keine Abos
                </span>
              </div>
              <i class="fas fa-chevron-down collapse-indicator mobile-only"
                 [class.collapsed]="mobilePanelState.subscriptions === 'collapsed'"></i>
            </div>
            
            <div class="card-body">
              <app-subscription-panel
                [subscriptions]="subscriptions"
                [selectedContract]="selectedContract"
                [selectedSubscription]="selectedSubscription"
                (subscriptionSelected)="onSubscriptionSelected($event)">
              </app-subscription-panel>
            </div>
          </div>
        </div>

        <!-- Finanz-Tabs Panel -->
        <div class="financial-section">
          <div class="card"
               [class.mobile-collapsed]="isMobile && mobilePanelState.financial === 'collapsed'"
               [class.mobile-expanded]="isMobile && mobilePanelState.financial === 'expanded'">
            
            <div class="card-header" 
                 (click)="toggleMobilePanel('financial')"
                 [class.clickable]="isMobile">
              <div class="card-title">
                <i class="fas fa-chart-line me-2"></i>
                Finanzdetails
                <span class="badge bg-success ms-2" *ngIf="selectedSubscription">
                  {{ selectedSubscription.name || 'Ausgewählt' }}
                </span>
                <span class="badge bg-secondary ms-2" *ngIf="!selectedSubscription">
                  Kein Abo gewählt
                </span>
              </div>
              <i class="fas fa-chevron-down collapse-indicator mobile-only"
                 [class.collapsed]="mobilePanelState.financial === 'collapsed'"></i>
            </div>
            
            <div class="card-body">
              <app-financial-tabs
                [selectedContract]="selectedContract"
                [selectedSubscription]="selectedSubscription"
                [customers]="customers"
                (invoiceAction)="onInvoiceAction($event)"
                (openItemAction)="onOpenItemAction($event)">
              </app-financial-tabs>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Breadcrumb Navigation -->
      <div class="mobile-breadcrumb" *ngIf="isMobile && getMobileBreadcrumb().length > 0">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-0">
            <li class="breadcrumb-item" 
                *ngFor="let item of getMobileBreadcrumb(); let last = last"
                [class.active]="last">
              {{ item }}
            </li>
          </ol>
        </nav>
      </div>
    </div>
  `,
  styleUrls: ['./contract-center.scss']
})
export class ContractCenterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Original data properties
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
  mobilePanelState: MobilePanelState = {
    contracts: 'normal',
    subscriptions: 'normal',
    financial: 'normal'
  };

  constructor(
    private contractService: ContractService,
    private customerService: CustomerService,
    private subscriptionService: SubscriptionService,
    private invoiceService: InvoiceService
  ) {}

  ngOnInit(): void {
    this.checkMobileView();
    this.initializeMobileState();
    this.loadCustomers();
    this.loadContracts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Restore body scroll on destroy
    document.body.style.overflow = '';
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkMobileView();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapePress(event: KeyboardEvent) {
    if (this.isMobile && this.hasExpandedPanel) {
      this.collapseAllPanels();
    }
  }

  // Mobile detection and management
  private checkMobileView() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 768;
    
    if (wasMobile !== this.isMobile) {
      this.initializeMobileState();
    }
  }

  private initializeMobileState() {
    if (this.isMobile) {
      // Mobile: Start with contracts visible, others collapsed
      this.mobilePanelState = {
        contracts: 'normal',
        subscriptions: 'collapsed',
        financial: 'collapsed'
      };
    } else {
      // Desktop: All panels normal
      this.mobilePanelState = {
        contracts: 'normal',
        subscriptions: 'normal',
        financial: 'normal'
      };
    }
  }

  // Mobile panel management
  toggleMobilePanel(panel: keyof MobilePanelState) {
    if (!this.isMobile) return;

    const currentState = this.mobilePanelState[panel];

    if (currentState === 'collapsed') {
      // Expand this panel, collapse others
      this.collapseAllPanels();
      this.mobilePanelState[panel] = 'expanded';
      document.body.style.overflow = 'hidden';
      
    } else if (currentState === 'expanded') {
      // Collapse this panel
      this.mobilePanelState[panel] = 'collapsed';
      document.body.style.overflow = '';
      
    } else {
      // From normal to collapsed
      this.mobilePanelState[panel] = 'collapsed';
    }
  }

  collapseAllPanels() {
    if (!this.isMobile) return;

    this.mobilePanelState = {
      contracts: 'collapsed',
      subscriptions: 'collapsed',
      financial: 'collapsed'
    };
    
    document.body.style.overflow = '';
  }

  get hasExpandedPanel(): boolean {
    return Object.values(this.mobilePanelState).some(state => state === 'expanded');
  }

  getMobileBreadcrumb(): string[] {
    const breadcrumb: string[] = [];
    
    if (this.selectedContract) {
      breadcrumb.push(this.selectedContract.contractTitle || 'Vertrag');
    }
    
    if (this.selectedSubscription) {
      breadcrumb.push(this.selectedSubscription.productName || 'Abonnement');
    }
    
    return breadcrumb;
  }

  // Original load methods
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
          
          // Mobile: Auto-expand subscriptions if available
          if (this.isMobile && subs.length > 0) {
            this.mobilePanelState.subscriptions = 'normal';
            this.mobilePanelState.contracts = 'collapsed';
          }
        },
        error: err => {
          console.error('Fehler beim Laden der Abonnements:', err);
          this.subscriptions = [];
        }
      });
  }

  // Enhanced event handlers with mobile navigation
  onContractSelected(contract: Contract): void {
    if (this.selectedContract?.id === contract.id) return;

    this.selectedContract = contract;
    this.subscriptions = [];
    this.selectedSubscription = null;

    // Mobile: Smart navigation flow
    if (this.isMobile) {
      this.mobilePanelState.contracts = 'collapsed';
      this.mobilePanelState.subscriptions = 'normal';
      this.mobilePanelState.financial = 'collapsed';
    }

    this.loadSubscriptions(contract.id!);
  }

  onSubscriptionSelected(subscription: Subscription): void {
    if (this.selectedSubscription?.id === subscription.id) return;

    this.selectedSubscription = subscription;

    // Mobile: Navigate to financial details
    if (this.isMobile) {
      this.mobilePanelState.subscriptions = 'collapsed';
      this.mobilePanelState.financial = 'normal';
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