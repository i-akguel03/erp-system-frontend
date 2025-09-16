import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule],
  templateUrl: './contract-list.html',
  styleUrls: ['./contract-list.scss']
})
export class ContractListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  @Input() contracts: Contract[] = [];
  @Input() customers: { [id: string]: Customer } = {};
  @Input() loading: boolean = false;
  @Input() error: string | null = null;
  @Input() selectedContract: Contract | null = null;

  @Output() contractSelected = new EventEmitter<Contract>();
  @Output() contractAction = new EventEmitter<ContractActionEvent>();

  filteredContracts: Contract[] = [];
  searchTerm: string = '';

  // Kontextmenü
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

  ngOnChanges(): void {
    this.performSearch(this.searchTerm);
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => this.performSearch(searchTerm));
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

    this.filteredContracts = this.contracts.filter(contract => {
      const customer = this.getCustomerById(contract.customerId);
      const customerStr = customer ? `${customer.firstName} ${customer.lastName} ${customer.customerNumber}` : '';
      
      return (contract.contractNumber?.toLowerCase().includes(searchTerm)) ||
        (contract.contractTitle?.toLowerCase().includes(searchTerm)) ||
        (contract.contractStatus?.toLowerCase().includes(searchTerm)) ||
        customerStr.toLowerCase().includes(searchTerm);
    });
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

  // Vertragsstatus-Logik
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
      case 'Aktiv': return 'badge bg-success';
      case 'Geplant': return 'badge bg-warning text-dark';
      case 'Abgelaufen': return 'badge bg-secondary';
      default: return 'badge bg-light text-dark';
    }
  }

  private safeDate(value?: string | Date): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  // Kontextmenü-Funktionen
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
    
    this.contractAction.emit({
      action,
      contract: this.contextMenuContract
    });
    
    this.closeContextMenu();
  }

  closeContextMenu(): void {
    this.contextMenuVisible = false;
    this.contextMenuContract = null;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.contextMenuVisible) {
      this.closeContextMenu();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.contextMenuVisible) {
      this.closeContextMenu();
    }
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(event: Event): void {
    if (this.contextMenuVisible) {
      this.closeContextMenu();
    }
  }
}