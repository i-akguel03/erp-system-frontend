import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Contract } from '../../models/Contract';
import { Subscription } from '../../models/Subscription';
import { ContractService } from '../../services/contract-service';
import { SubscriptionService } from '../../services/subscription-service';
import { DueScheduleService } from '../../services/due-schedule-service';
import { DueSchedule } from '../../models/DueSchedule';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../services/customer-service';
import { Customer } from '../../models/Customer';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-contract-center',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contract-center.html',
  styleUrls: ['./contract-center.scss']
})
export class ContractCenterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  contracts: Contract[] = [];
  filteredContracts: Contract[] = [];
  selectedContract: Contract | null = null;
  subscriptions: Subscription[] = [];
  selectedSubscription: Subscription | null = null;
  dueSchedules: DueSchedule[] = [];
  customers: { [id: string]: Customer } = {};
  customersArray: Customer[] = [];

  searchTerm: string = '';
  loading: boolean = false;
  error: string | null = null;
  currentTheme: 'light' | 'dark' = 'light';
  themeIcon: string = 'fas fa-moon';

  contextMenuVisible = false;
  contextMenuPosition = { x: 0, y: 0 };
  contextMenuContract: Contract | null = null;

  constructor(
    private contractService: ContractService,
    private subscriptionService: SubscriptionService,
    private dueScheduleService: DueScheduleService,
    private customerService: CustomerService
  ) {
    this.initializeTheme();
    this.setupSearch();
  }

  ngOnInit(): void {
    this.loadCustomers();
    this.loadContracts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeTheme(): void {
    const savedTheme = localStorage.getItem('contract-center-theme') as 'light' | 'dark';
    this.currentTheme = savedTheme || 'light';
    this.updateThemeIcon();
    this.applyTheme();
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => this.performSearch(searchTerm));
  }

  toggleTheme(): void {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.updateThemeIcon();
    this.applyTheme();
    localStorage.setItem('contract-center-theme', this.currentTheme);
  }

  private updateThemeIcon(): void {
    this.themeIcon = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
  }

  private applyTheme(): void {
    document.body.setAttribute('data-theme', this.currentTheme);
  }

  loadCustomers(): void {
    this.customerService.getCustomers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.customersArray = data;
          this.customers = {};
          data.forEach(c => { if (c.id) this.customers[c.id] = c; });
        },
        error: err => {
          console.error('Fehler beim Laden der Kunden:', err);
          this.error = 'Fehler beim Laden der Kunden. Bitte versuchen Sie es erneut.';
        }
      });
  }

  loadContracts(): void {
    this.loading = true;
    this.error = null;

    this.contractService.getContracts(false)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.contracts = data;
          this.filteredContracts = [...this.contracts];
          this.loading = false;
        },
        error: err => {
          console.error('Error loading contracts:', err);
          this.error = 'Fehler beim Laden der Verträge. Bitte versuchen Sie es erneut.';
          this.loading = false;
        }
      });
  }

  filterContracts(): void {
    this.searchSubject.next(this.searchTerm);
  }

  private performSearch(term: string): void {
    const searchTerm = term.toLowerCase().trim();
    if (!searchTerm) {
      this.filteredContracts = [...this.contracts];
      return;
    }

    this.filteredContracts = this.contracts.filter(c => {
      const customer = this.getCustomerById(c.customerId);
      const customerStr = customer ? `${customer.firstName} ${customer.lastName} ${customer.customerNumber}` : '';
      return (c.contractNumber?.toLowerCase().includes(searchTerm)) ||
             (c.contractTitle?.toLowerCase().includes(searchTerm)) ||
             (c.contractStatus?.toLowerCase().includes(searchTerm)) ||
             customerStr.toLowerCase().includes(searchTerm);
    });
  }

  getCustomerById(customerId?: string): Customer | undefined {
    return this.customersArray.find(c => c.id === customerId);
  }

  getCustomerByIdFromDict(customerId?: string): Customer | undefined {
    if (!customerId) return undefined;
    return this.customers[customerId];
  }

  selectContract(contract: Contract): void {
    if (this.selectedContract?.id === contract.id) return;

    this.selectedContract = contract;
    this.subscriptions = [];
    this.selectedSubscription = null;
    this.dueSchedules = [];
    this.loadSubscriptions(contract.id!);
  }

  private loadSubscriptions(contractId: string): void {
    this.subscriptionService.getSubscriptionsByContract(contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: subs => this.subscriptions = subs,
        error: err => { console.error('Error loading subscriptions:', err); this.subscriptions = []; }
      });
  }

  selectSubscription(subscription: Subscription): void {
    if (this.selectedSubscription?.id === subscription.id) return;

    this.selectedSubscription = subscription;
    this.dueSchedules = [];
    this.loadDueSchedules(subscription.id!);
  }

  private loadDueSchedules(subscriptionId: string): void {
    this.dueScheduleService.getDueSchedulesBySubscription(subscriptionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: schedules => {
          this.dueSchedules = schedules.sort((a, b) => {
            const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
            const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
            return aTime - bTime;
          });
        },
        error: err => { console.error('Error loading due schedules:', err); this.dueSchedules = []; }
      });
  }

  isSelectedContract(contract: Contract): boolean {
    return this.selectedContract?.id === contract.id;
  }

  isSelectedSubscription(subscription: Subscription): boolean {
    return this.selectedSubscription?.id === subscription.id;
  }

  // Utility für sichere Datumsbehandlung
  private safeDate(value?: string | Date): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  getContractStatus(contract: Contract): string {
    const now = new Date();
    const startDate = this.safeDate(contract.startDate);
    const endDate = this.safeDate(contract.endDate);
    if (!startDate || !endDate) return 'Unbekannt';

    if (now < startDate) return 'Geplant';
    if (now > endDate) return 'Abgelaufen';
    return 'Aktiv';
  }

  getContractStatusClass(contract: Contract): string {
    const status = this.getContractStatus(contract);
    switch (status) {
      case 'Aktiv': return 'status-active';
      case 'Geplant': return 'status-planned';
      case 'Abgelaufen': return 'status-expired';
      default: return 'status-unknown';
    }
  }

  getSubscriptionStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'status-active';
      case 'PAUSED': return 'status-paused';
      case 'CANCELLED': return 'status-cancelled';
      default: return 'status-unknown';
    }
  }

  getPaymentStatusClass(dueSchedule: DueSchedule): string {
    if (dueSchedule.paidDate) return 'payment-paid';
    if (!dueSchedule.dueDate) return 'payment-unknown';

    const dueDate = this.safeDate(dueSchedule.dueDate);
    if (!dueDate) return 'payment-unknown';

    return new Date() > dueDate ? 'payment-overdue' : 'payment-pending';
  }

  getPaymentStatusIcon(dueSchedule: DueSchedule): string {
    if (dueSchedule.paidDate) return 'fas fa-check-circle';
    if (!dueSchedule.dueDate) return 'fas fa-question-circle';

    const dueDate = this.safeDate(dueSchedule.dueDate);
    if (!dueDate) return 'fas fa-question-circle';

    return new Date() > dueDate ? 'fas fa-exclamation-triangle' : 'fas fa-clock';
  }

  getPaymentStatusText(dueSchedule: DueSchedule): string {
    if (dueSchedule.paidDate) {
      const paidDateObj = this.safeDate(dueSchedule.paidDate);
      return paidDateObj ? `Bezahlt am ${paidDateObj.toLocaleDateString('de-DE')}` : 'Bezahlt (Datum ungültig)';
    }

    const dueDate = this.safeDate(Date());
    if (!dueDate) return 'Kein Fälligkeitsdatum';

    const diffDays = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `Überfällig seit ${Math.abs(diffDays)} Tag${Math.abs(diffDays) !== 1 ? 'en' : ''}`;
    if (diffDays === 0) return 'Heute fällig';
    if (diffDays === 1) return 'Morgen fällig';
    return `Fällig in ${diffDays} Tag${diffDays !== 1 ? 'en' : ''}`;
  }

  onContractRightClick(event: MouseEvent, contract: Contract): void {
    event.preventDefault();
    event.stopPropagation();

    this.contextMenuContract = contract;
    this.contextMenuPosition = {
      x: Math.min(event.clientX, window.innerWidth - 220),
      y: Math.min(event.clientY, window.innerHeight - 200)
    };
    this.contextMenuVisible = true;
  }

  onContractAction(action: string): void {
    if (!this.contextMenuContract) return;
    const contract = this.contextMenuContract;

    switch (action) {
      case 'neu': this.createNewContract(); break;
      case 'edit': this.editContract(contract); break;
      case 'duplicate': this.duplicateContract(contract); break;
      case 'kündigen': this.terminateContract(contract); break;
      case 'stornieren': this.cancelContract(contract); break;
    }

    this.closeContextMenu();
  }

  closeContextMenu(): void {
    this.contextMenuVisible = false;
    this.contextMenuContract = null;
  }

  private createNewContract(): void { console.log('Creating new contract'); }
  private editContract(contract: Contract): void { console.log('Editing contract:', contract); }
  private duplicateContract(contract: Contract): void { console.log('Duplicating contract:', contract); }
  private terminateContract(contract: Contract): void {
    if (confirm(`Möchten Sie den Vertrag "${contract.contractTitle}" wirklich kündigen?`)) {
      console.log('Terminating contract:', contract);
    }
  }
  private cancelContract(contract: Contract): void {
    if (confirm(`Möchten Sie den Vertrag "${contract.contractTitle}" wirklich stornieren?`)) {
      console.log('Cancelling contract:', contract);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void { if (this.contextMenuVisible) this.closeContextMenu(); }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void { if (this.contextMenuVisible) this.closeContextMenu(); }

  @HostListener('window:resize', ['$event'])
  onWindowResize(event: Event): void { if (this.contextMenuVisible) this.closeContextMenu(); }
}
