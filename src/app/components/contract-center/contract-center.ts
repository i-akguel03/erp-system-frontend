import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, switchMap, of, Observable } from 'rxjs';
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
import { EmailService } from '../../services/email.service';
import { Product } from '../../models/Product';
import { BillingCycle } from '../../models/Subscription';

import { SubscriptionPanelComponent } from './components/subscription-panel/subscription-panel';
import { FinancialTabsComponent } from './components/financial-tabs/financial-tabs';
import { ContractListComponent } from './components/contract-list/contract-list';

interface ContractActionEvent {
  action: 'neu' | 'edit' | 'duplicate' | 'kündigen' | 'stornieren' | 'verlängern' | 'email';
  contract: Contract;
}
interface InvoiceActionEvent { action: 'edit' | 'send' | 'details'; invoice: Invoice; }
interface OpenItemActionEvent { action: 'payment' | 'reminder' | 'details' | 'edit' | 'cancel'; openItem: OpenItem; }

type DetailTab = 'uebersicht' | 'abonnements' | 'finanzen';

@Component({
  selector: 'app-contract-center',
  standalone: true,
  imports: [CommonModule, FormsModule, Dialog, ContractListComponent, SubscriptionPanelComponent, FinancialTabsComponent],
  templateUrl: './contract-center.html',
  styleUrls: ['./contract-center.scss']
})
export class ContractCenterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // ─── Daten ────────────────────────────────────────────────────────────────
  contracts: Contract[] = [];
  selectedContract: Contract | null = null;
  subscriptions: Subscription[] = [];
  selectedSubscription: Subscription | null = null;
  customers: { [id: string]: Customer } = {};
  products: Product[] = [];

  // ─── UI-Status ────────────────────────────────────────────────────────────
  loading = false;
  error: string | null = null;
  renewalBatchLoading = false;
  activeDetailTab: DetailTab = 'abonnements';

  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;

  // Mobile
  isMobile = false;
  mobileView: 'contracts' | 'detail' = 'contracts';

  // Contract-Modal
  showContractModal = false;
  contractModalTitle = '';
  contractModalMode: 'create' | 'edit' | 'duplicate' = 'create';
  contractForm: Partial<Contract> = {};
  contractStartDateString = '';
  contractEndDateString = '';
  contractModalLoading = false;
  private originalContractStatus: string | undefined;

  // Subscription-Modal
  showSubscriptionModal = false;
  subscriptionForm: Partial<Subscription> = {};
  subscriptionStartDateString = '';
  subscriptionEndDateString = '';
  subscriptionModalLoading = false;

  readonly billingCycleOptions: { label: string; value: BillingCycle }[] = [
    { label: 'Monatlich', value: BillingCycle.MONTHLY },
    { label: 'Vierteljährlich', value: BillingCycle.QUARTERLY },
    { label: 'Halbjährlich', value: BillingCycle.SEMI_ANNUALLY },
    { label: 'Jährlich', value: BillingCycle.ANNUALLY },
  ];

  emailSendingId: string | null = null;

  get customersArray(): Customer[] { return Object.values(this.customers); }

  get expiringContractCount(): number {
    const threshold = 30 * 86_400_000;
    return this.contracts.filter(c => {
      if (!c.endDate || c.contractStatus !== 'ACTIVE') return false;
      const diff = new Date(c.endDate).getTime() - Date.now();
      return diff >= 0 && diff <= threshold;
    }).length;
  }

  get activeSubscriptionCount(): number {
    return this.subscriptions.filter(s => s.subscriptionStatus === 'ACTIVE' || !(s.subscriptionStatus)).length;
  }

  get selectedCustomerName(): string {
    if (!this.selectedContract?.customerId) return '';
    const c = this.customers[this.selectedContract.customerId];
    return c ? `${c.firstName} ${c.lastName}` : '';
  }

  constructor(
    private el: ElementRef,
    private contractService: ContractService,
    private customerService: CustomerService,
    private subscriptionService: SubscriptionService,
    private invoiceService: InvoiceService,
    private productService: ProductService,
    private confirmationService: ConfirmationService,
    private notificationService: NotificationService,
    private emailService: EmailService
  ) {}

  ngOnInit(): void {
    this.checkMobile();
    this.loadCustomers();
    this.loadPage(0);
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.unlockBodyScroll();
  }

  @HostListener('window:resize') onResize(): void { this.checkMobile(); }

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.isMobile && this.mobileView === 'detail') this.navigateBack(); }

  // ─── Mobile ───────────────────────────────────────────────────────────────
  private checkMobile(): void {
    const was = this.isMobile;
    this.isMobile = window.innerWidth <= 768;
    if (was !== this.isMobile) {
      if (this.isMobile) this.lockBodyScroll(); else this.unlockBodyScroll();
      if (!this.isMobile) this.mobileView = 'contracts';
    }
  }
  navigateBack(): void { this.mobileView = 'contracts'; this.selectedContract = null; this.subscriptions = []; this.selectedSubscription = null; }
  private lockBodyScroll(): void { document.body.style.cssText = 'overflow:hidden;position:fixed;width:100%;height:100%'; document.documentElement.style.overflow = 'hidden'; }
  private unlockBodyScroll(): void { document.body.style.cssText = ''; document.documentElement.style.overflow = ''; }

  setDetailTab(tab: DetailTab): void { this.activeDetailTab = tab; }

  // ─── Datenladen ───────────────────────────────────────────────────────────
  private loadCustomers(): void {
    this.customerService.getCustomers().pipe(takeUntil(this.destroy$)).subscribe({
      next: customers => { this.customers = {}; customers.forEach(c => { if (c.id) this.customers[c.id] = c; }); },
      error: () => {}
    });
  }

  loadContracts(): void { this.loadPage(this.currentPage); }

  loadPage(page: number): void {
    this.loading = true;
    this.error = null;
    this.contractService.getContractsPaginated(page, this.pageSize).pipe(takeUntil(this.destroy$)).subscribe({
      next: result => {
        this.contracts = result.content;
        this.currentPage = result.currentPage;
        this.totalPages = result.totalPages;
        this.totalElements = result.totalElements;
        this.loading = false;
      },
      error: err => { this.error = err.error?.message || `Fehler beim Laden (HTTP ${err.status})`; this.loading = false; }
    });
  }

  onPageChange(page: number): void { this.loadPage(page); }

  private loadProducts(): void {
    this.productService.getProducts().pipe(takeUntil(this.destroy$)).subscribe({
      next: p => { this.products = p; },
      error: () => this.notificationService.warn('Produkte konnten nicht geladen werden.')
    });
  }

  private loadSubscriptions(contractId: string): void {
    this.subscriptionService.getSubscriptionsByContract(contractId).pipe(takeUntil(this.destroy$)).subscribe({
      next: subs => { this.subscriptions = subs; },
      error: () => { this.subscriptions = []; this.notificationService.warn('Abonnements konnten nicht geladen werden.'); }
    });
  }

  // ─── Event-Handler ────────────────────────────────────────────────────────
  onContractSelected(contract: Contract): void {
    if (this.selectedContract?.id === contract.id && !this.isMobile) return;
    this.selectedContract = contract;
    this.subscriptions = [];
    this.selectedSubscription = null;
    this.activeDetailTab = 'uebersicht';
    if (this.isMobile) this.mobileView = 'detail';
    this.loadSubscriptions(contract.id!);
  }

  onSubscriptionSelected(subscription: Subscription): void {
    if (this.selectedSubscription?.id === subscription.id && !this.isMobile) return;
    this.selectedSubscription = subscription;
    if (this.isMobile) this.activeDetailTab = 'finanzen';
  }

  onCreateSubscription(): void { this.openSubscriptionModal(); }

  onContractAction(event: ContractActionEvent): void {
    const { action, contract } = event;
    switch (action) {
      case 'neu':        this.createNewContract(); break;
      case 'edit':       this.editContract(contract); break;
      case 'duplicate':  this.duplicateContract(contract); break;
      case 'kündigen':   this.terminateContract(contract); break;
      case 'stornieren': this.cancelContract(contract); break;
      case 'verlängern': this.renewContract(contract); break;
      case 'email':      this.sendContractExpiryNotice(contract); break;
    }
  }

  onInvoiceAction(event: InvoiceActionEvent): void { /* handled by FinancialTabsComponent */ }
  onOpenItemAction(event: OpenItemActionEvent): void { /* handled by FinancialTabsComponent */ }

  // ─── Contract-Aktionen ────────────────────────────────────────────────────
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
      this.originalContractStatus = contract.contractStatus;
      this.contractStartDateString = this.formatDateForInput(contract.startDate);
      this.contractEndDateString = this.formatDateForInput(contract.endDate);
    } else if (mode === 'duplicate' && contract) {
      this.contractModalTitle = 'Vertrag duplizieren';
      this.contractForm = { contractTitle: `${contract.contractTitle} (Kopie)`, customerId: contract.customerId, contractStatus: 'DRAFT' };
      this.contractStartDateString = new Date().toISOString().split('T')[0];
      this.contractEndDateString = '';
    }
    this.showContractModal = true;
  }

  closeContractModal(): void { this.showContractModal = false; this.contractForm = {}; this.contractModalLoading = false; this.originalContractStatus = undefined; }

  private getStatusChangePatch(id: string, status: string): Observable<Contract> {
    switch (status) {
      case 'ACTIVE':     return this.contractService.activateContract(id);
      case 'SUSPENDED':  return this.contractService.suspendContract(id);
      case 'TERMINATED': return this.contractService.terminateContract(id);
      default:           return of({} as Contract);
    }
  }

  saveContract(): void {
    if (!this.contractForm.contractTitle?.trim() || !this.contractForm.customerId) {
      this.notificationService.warn('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }
    const contract: Contract = { ...this.contractForm, startDate: this.contractStartDateString || undefined, endDate: this.contractEndDateString || undefined };
    this.contractModalLoading = true;
    if (this.contractModalMode === 'edit' && contract.id) {
      const statusChanged = this.originalContractStatus !== contract.contractStatus;
      const newStatus = contract.contractStatus;
      const contractForPut: Contract = statusChanged
        ? { ...contract, contractStatus: this.originalContractStatus as Contract['contractStatus'] }
        : contract;
      this.contractService.updateContract(contract.id, contractForPut).pipe(
        switchMap(updated => statusChanged && newStatus
          ? this.getStatusChangePatch(contract.id!, newStatus)
          : of(updated)),
        takeUntil(this.destroy$)
      ).subscribe({
        next: updated => { this.updateLocalContract(updated); this.closeContractModal(); this.notificationService.success('Vertrag aktualisiert'); },
        error: () => { this.contractModalLoading = false; this.notificationService.error('Fehler beim Aktualisieren'); }
      });
    } else {
      this.contractService.createContract(contract).pipe(takeUntil(this.destroy$)).subscribe({
        next: created => {
          this.contracts = [created, ...this.contracts];
          this.closeContractModal();
          this.notificationService.success(this.contractModalMode === 'duplicate' ? 'Vertrag dupliziert' : 'Vertrag erstellt');
        },
        error: () => { this.contractModalLoading = false; this.notificationService.error('Fehler beim Speichern'); }
      });
    }
  }

  private formatDateForInput(date?: string | Date): string {
    if (!date) return '';
    try { const d = typeof date === 'string' ? new Date(date) : date; return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0]; } catch { return ''; }
  }

  private createNewContract(): void { this.openContractModal('create'); }
  private editContract(c: Contract): void { this.openContractModal('edit', c); }
  private duplicateContract(c: Contract): void { this.openContractModal('duplicate', c); }

  private terminateContract(contract: Contract): void {
    if (!contract.id) return;
    this.confirmationService.confirm({
      message: `Vertrag "${contract.contractTitle}" wirklich kündigen?`,
      header: 'Vertrag kündigen', icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Kündigen', rejectLabel: 'Abbrechen',
      accept: () => this.contractService.terminateContract(contract.id!).pipe(takeUntil(this.destroy$)).subscribe({
        next: u => { this.updateLocalContract(u); this.notificationService.success('Vertrag gekündigt'); },
        error: () => this.notificationService.error('Fehler beim Kündigen')
      })
    });
  }

  private cancelContract(contract: Contract): void {
    if (!contract.id) return;
    this.confirmationService.confirm({
      message: `Vertrag "${contract.contractTitle}" wirklich stornieren?`,
      header: 'Vertrag stornieren', icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Stornieren', rejectLabel: 'Abbrechen',
      accept: () => this.contractService.terminateContract(contract.id!).pipe(takeUntil(this.destroy$)).subscribe({
        next: u => { this.updateLocalContract(u); this.notificationService.success('Vertrag storniert'); },
        error: err => this.notificationService.error(err?.error?.message || 'Fehler beim Stornieren')
      })
    });
  }

  private renewContract(contract: Contract): void {
    if (!contract.id) return;
    this.confirmationService.confirm({
      message: `Vertrag "${contract.contractTitle}" verlängern?`,
      header: 'Vertrag verlängern', icon: 'pi pi-refresh',
      acceptLabel: 'Verlängern', rejectLabel: 'Abbrechen',
      accept: () => this.contractService.renewContract(contract.id!).pipe(takeUntil(this.destroy$)).subscribe({
        next: result => {
          if (result?.renewedContract) this.updateLocalContract(result.renewedContract); else this.loadContracts();
          this.notificationService.success('Vertrag verlängert');
        },
        error: () => this.notificationService.error('Fehler beim Verlängern')
      })
    });
  }

  runRenewalBatch(): void {
    this.renewalBatchLoading = true;
    this.contractService.runRenewalBatch().pipe(takeUntil(this.destroy$)).subscribe({
      next: result => {
        this.renewalBatchLoading = false;
        const count = result?.renewedCount ?? result?.processed ?? '?';
        this.notificationService.success(`Verlängerungslauf: ${count} Vertrag/Verträge verlängert`);
        this.loadPage(0);
      },
      error: () => { this.renewalBatchLoading = false; this.notificationService.error('Fehler beim Verlängerungslauf'); }
    });
  }

  private sendContractExpiryNotice(contract: Contract): void {
    if (!contract.id || this.emailSendingId === contract.id) return;
    this.emailSendingId = contract.id;
    this.emailService.sendContractExpiryNotice(contract.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.notificationService.success('Ablaufhinweis-E-Mail gesendet.'); this.emailSendingId = null; },
      error: () => { this.notificationService.error('E-Mail konnte nicht gesendet werden.'); this.emailSendingId = null; }
    });
  }

  private updateLocalContract(updated: Contract): void {
    const idx = this.contracts.findIndex(c => c.id === updated.id);
    if (idx >= 0) this.contracts[idx] = updated;
    if (this.selectedContract?.id === updated.id) this.selectedContract = updated;
  }

  // ─── Subscription-Modal ───────────────────────────────────────────────────
  openSubscriptionModal(): void {
    if (!this.selectedContract?.id) { this.notificationService.warn('Bitte wählen Sie zuerst einen Vertrag aus.'); return; }
    this.subscriptionForm = { contractId: this.selectedContract.id, billingCycle: BillingCycle.MONTHLY, autoRenewal: false };
    this.subscriptionStartDateString = new Date().toISOString().split('T')[0];
    this.subscriptionEndDateString = '';
    this.subscriptionModalLoading = false;
    this.showSubscriptionModal = true;
  }

  closeSubscriptionModal(): void { this.showSubscriptionModal = false; this.subscriptionForm = {}; this.subscriptionModalLoading = false; }

  onActivateSubscription(sub: Subscription): void {
    if (!sub.id) return;
    this.subscriptionService.activateSubscription(sub.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: updated => { this.updateLocalSubscription(updated); this.notificationService.success('Abonnement aktiviert'); },
      error: err => this.notificationService.error(err?.error?.message || 'Fehler beim Aktivieren')
    });
  }

  onPauseSubscription(sub: Subscription): void {
    if (!sub.id) return;
    this.subscriptionService.pauseSubscription(sub.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: updated => { this.updateLocalSubscription(updated); this.notificationService.success('Abonnement pausiert'); },
      error: err => this.notificationService.error(err?.error?.message || 'Fehler beim Pausieren')
    });
  }

  onTerminateSubscription(sub: Subscription): void {
    if (!sub.id) return;
    this.subscriptionService.terminateSubscription(sub.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: updated => { this.updateLocalSubscription(updated); this.notificationService.success('Abonnement gekündigt'); },
      error: err => this.notificationService.error(err?.error?.message || 'Fehler beim Kündigen')
    });
  }

  onCancelSubscription(sub: Subscription): void {
    if (!sub.id) return;
    this.subscriptionService.cancelSubscription(sub.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: updated => { this.updateLocalSubscription(updated); this.notificationService.success('Abonnement storniert'); },
      error: err => this.notificationService.error(err?.error?.message || 'Fehler beim Stornieren')
    });
  }

  private updateLocalSubscription(updated: Subscription): void {
    const idx = this.subscriptions.findIndex(s => s.id === updated.id);
    if (idx >= 0) this.subscriptions[idx] = updated;
    if (this.selectedSubscription?.id === updated.id) this.selectedSubscription = updated;
  }

  saveSubscription(): void {
    if (!this.subscriptionForm.productId || !this.subscriptionForm.billingCycle || !this.subscriptionStartDateString) {
      this.notificationService.warn('Bitte füllen Sie alle Pflichtfelder aus.'); return;
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
    this.subscriptionService.createSubscription(subscription).pipe(takeUntil(this.destroy$)).subscribe({
      next: created => { this.subscriptions = [...this.subscriptions, created]; this.closeSubscriptionModal(); this.notificationService.success('Abonnement erstellt'); },
      error: () => { this.subscriptionModalLoading = false; this.notificationService.error('Fehler beim Erstellen'); }
    });
  }

  // Status-Hilfsmethoden für Übersicht-Tab
  contractStatusBadge(s?: string): string {
    const m: any = { ACTIVE:'badge bg-success', DRAFT:'badge bg-warning text-dark', SUSPENDED:'badge bg-secondary', TERMINATED:'badge bg-dark text-white', EXPIRED:'badge bg-danger' };
    return m[s ?? ''] ?? 'badge bg-light text-dark';
  }
  contractStatusLabel(s?: string): string {
    const m: any = { ACTIVE:'Aktiv', DRAFT:'Entwurf', SUSPENDED:'Ausgesetzt', TERMINATED:'Gekündigt', EXPIRED:'Abgelaufen' };
    return m[s ?? ''] ?? s ?? '–';
  }
  formatDate(d: any): string {
    if (!d) return '–';
    try { return new Date(d).toLocaleDateString('de-DE'); } catch { return '–'; }
  }
}
