import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, HostListener, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SortPipe } from '../../../../shared/pipes/sort.pipe';
import { SortState } from '../../../../shared/utils/sort-state';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { Contract } from '../../../../models/Contract';
import { Customer } from '../../../../models/Customer';

interface ContractActionEvent {
  action: string;
  contract: Contract;
}

@Component({
  selector: 'app-contract-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SortPipe],
  templateUrl: './contract-list.html',
  styleUrls: ['./contract-list.scss']
})
export class ContractListComponent implements OnInit, OnChanges, OnDestroy {
  sort = new SortState();
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  @Input() contracts: Contract[] = [];
  @Input() customers: { [id: string]: Customer } = {};
  @Input() loading: boolean = false;
  @Input() error: string | null = null;
  @Input() selectedContract: Contract | null = null;

  @Output() contractSelected = new EventEmitter<Contract>();
  @Output() contractAction = new EventEmitter<ContractActionEvent>();
  @Output() retry = new EventEmitter<void>();

  filteredContracts: Contract[] = [];
  searchTerm: string = '';
  statusFilter: string = '';

  contextMenuVisible = false;
  contextMenuPosition = { x: 0, y: 0 };
  contextMenuContract: Contract | null = null;

  ngOnInit(): void {
    this.setupSearch();
    this.filteredContracts = [...this.contracts];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contracts']) {
      this.performSearch(this.searchTerm);
    }
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => this.performSearch(term));
  }

  filterContracts(): void {
    this.searchSubject.next(this.searchTerm);
  }

  filterByStatus(status: string): void {
    this.statusFilter = status;
    this.performSearch(this.searchTerm);
  }

  private performSearch(term: string): void {
    let list = [...this.contracts];

    if (this.statusFilter === 'EXPIRING') {
      list = list.filter(c => this.isExpiringSoon(c));
    } else if (this.statusFilter) {
      list = list.filter(c => c.contractStatus === this.statusFilter);
    }

    const searchTerm = term.toLowerCase().trim();
    if (searchTerm) {
      list = list.filter(contract => {
        const customer = this.getCustomerById(contract.customerId);
        const customerStr = customer
          ? `${customer.firstName} ${customer.lastName} ${customer.customerNumber}`
          : '';
        return (
          contract.contractNumber?.toLowerCase().includes(searchTerm) ||
          contract.contractTitle?.toLowerCase().includes(searchTerm) ||
          contract.contractStatus?.toLowerCase().includes(searchTerm) ||
          customerStr.toLowerCase().includes(searchTerm)
        );
      });
    }

    this.filteredContracts = list;
  }

  getStatusCount(status: string): number {
    return this.contracts.filter(c => c.contractStatus === status).length;
  }

  getExpiringCount(): number {
    return this.contracts.filter(c => this.isExpiringSoon(c)).length;
  }

  isExpiringSoon(contract: Contract): boolean {
    if (!contract.endDate || contract.contractStatus !== 'ACTIVE') return false;
    const days = Math.ceil(
      (new Date(contract.endDate).getTime() - Date.now()) / 86_400_000
    );
    return days >= 0 && days <= 30;
  }

  getRowClass(contract: Contract): Record<string, boolean> {
    return {
      'table-active bg-primary bg-opacity-10': this.isSelectedContract(contract),
      'row-expiring': !this.isSelectedContract(contract) && this.isExpiringSoon(contract),
    };
  }

  emitCreateContract(): void {
    this.contractAction.emit({ action: 'neu', contract: {} });
  }

  selectContract(contract: Contract): void {
    this.contractSelected.emit(contract);
  }

  isSelectedContract(contract: Contract): boolean {
    return this.selectedContract?.id === contract.id;
  }

  getCustomerById(customerId?: string): Customer | undefined {
    if (!customerId) return undefined;
    return this.customers[customerId];
  }

  getContractStatus(contract: Contract): string {
    const labels: Record<string, string> = {
      ACTIVE: 'Aktiv',
      DRAFT: 'Entwurf',
      SUSPENDED: 'Ausgesetzt',
      TERMINATED: 'Gekündigt',
      EXPIRED: 'Abgelaufen',
    };
    return labels[contract.contractStatus ?? ''] ?? contract.contractStatus ?? 'Unbekannt';
  }

  getContractStatusClass(contract: Contract): string {
    switch (contract.contractStatus) {
      case 'ACTIVE':     return 'badge bg-success';
      case 'DRAFT':      return 'badge bg-warning text-dark';
      case 'SUSPENDED':  return 'badge bg-secondary';
      case 'TERMINATED': return 'badge bg-dark text-white';
      case 'EXPIRED':    return 'badge bg-danger';
      default:           return 'badge bg-light text-dark';
    }
  }

  onContractMenuClick(event: MouseEvent, contract: Contract): void {
    event.stopPropagation();
    const btn = event.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    this.contextMenuContract = contract;
    this.contextMenuPosition = {
      x: Math.max(4, Math.min(rect.right - 220, window.innerWidth - 224)),
      y: this.calcMenuY(rect.bottom, rect.top)
    };
    this.contextMenuVisible = true;
  }

  onContractRightClick(event: MouseEvent, contract: Contract): void {
    event.preventDefault();
    event.stopPropagation();
    this.contextMenuContract = contract;
    this.contextMenuPosition = {
      x: Math.max(4, Math.min(event.clientX, window.innerWidth - 224)),
      y: this.calcMenuY(event.clientY, event.clientY)
    };
    this.contextMenuVisible = true;
  }

  private calcMenuY(triggerBottom: number, triggerTop: number): number {
    const menuH = 300;
    const isMobile = window.innerWidth <= 768;
    const headerH = isMobile ? 56 : 0;
    const tabBarH = isMobile ? 62 : 0;
    const panelH = window.innerHeight - headerH - tabBarH;
    const bottomInPanel = triggerBottom - headerH;
    const topInPanel    = triggerTop   - headerH;
    const spaceBelow = panelH - bottomInPanel;
    return spaceBelow >= menuH
      ? Math.max(4, bottomInPanel + 4)
      : Math.max(4, topInPanel - menuH - 4);
  }

  onContractAction(action: string): void {
    if (!this.contextMenuContract) return;
    this.contractAction.emit({ action, contract: this.contextMenuContract });
    this.closeContextMenu();
  }

  closeContextMenu(): void {
    this.contextMenuVisible = false;
    this.contextMenuContract = null;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.contextMenuVisible) this.closeContextMenu();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.contextMenuVisible) this.closeContextMenu();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.contextMenuVisible) this.closeContextMenu();
  }
}
