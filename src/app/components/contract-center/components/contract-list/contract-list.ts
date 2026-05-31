import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, HostListener, SimpleChanges } from '@angular/core';
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
export class ContractListComponent implements OnInit, OnChanges, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  @Input() contracts: Contract[] = [];
  @Input() customers: { [id: string]: Customer } = {};
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() selectedContract: Contract | null = null;
  @Input() currentPage = 0;
  @Input() totalPages = 0;
  @Input() totalElements = 0;

  @Output() contractSelected = new EventEmitter<Contract>();
  @Output() contractAction = new EventEmitter<ContractActionEvent>();
  @Output() retry = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<number>();

  filteredContracts: Contract[] = [];
  searchTerm = '';
  statusFilter = '';

  contextMenuVisible = false;
  contextMenuPosition = { x: 0, y: 0 };
  contextMenuContract: Contract | null = null;

  ngOnInit(): void {
    this.searchSubject.pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(term => this.performSearch(term));
    this.filteredContracts = [...this.contracts];
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contracts']) this.performSearch(this.searchTerm);
  }

  filterContracts(): void { this.searchSubject.next(this.searchTerm); }
  clearSearch(): void { this.searchTerm = ''; this.performSearch(''); }

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
    const q = term.toLowerCase().trim();
    if (q) {
      list = list.filter(c => {
        const cust = this.getCustomer(c.customerId);
        const custStr = cust ? `${cust.firstName} ${cust.lastName} ${cust.customerNumber}` : '';
        return c.contractNumber?.toLowerCase().includes(q) ||
               c.contractTitle?.toLowerCase().includes(q) ||
               custStr.toLowerCase().includes(q);
      });
    }
    this.filteredContracts = list;
  }

  isExpiringSoon(c: Contract): boolean {
    if (!c.endDate || c.contractStatus !== 'ACTIVE') return false;
    const days = Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86_400_000);
    return days >= 0 && days <= 30;
  }

  getStatusCount(status: string): number {
    return this.contracts.filter(c => c.contractStatus === status).length;
  }
  getExpiringCount(): number { return this.contracts.filter(c => this.isExpiringSoon(c)).length; }

  selectContract(c: Contract): void { this.contractSelected.emit(c); }
  isSelected(c: Contract): boolean { return this.selectedContract?.id === c.id; }

  getCustomer(customerId?: string): Customer | undefined {
    return customerId ? this.customers[customerId] : undefined;
  }

  statusBadgeClass(status?: string): string {
    const m: any = { ACTIVE:'badge bg-success', DRAFT:'badge bg-warning text-dark', SUSPENDED:'badge bg-secondary', TERMINATED:'badge bg-dark text-white', EXPIRED:'badge bg-danger' };
    return m[status ?? ''] ?? 'badge bg-light text-dark';
  }
  statusLabel(status?: string): string {
    const m: any = { ACTIVE:'Aktiv', DRAFT:'Entwurf', SUSPENDED:'Ausgesetzt', TERMINATED:'Gekündigt', EXPIRED:'Abgelaufen' };
    return m[status ?? ''] ?? status ?? '–';
  }
  statusIcon(status?: string): string {
    const m: any = { ACTIVE:'bi-check-circle-fill text-success', DRAFT:'bi-pencil-square text-warning', SUSPENDED:'bi-pause-circle text-secondary', TERMINATED:'bi-x-circle-fill text-danger', EXPIRED:'bi-clock-history text-danger' };
    return m[status ?? ''] ?? 'bi-circle text-muted';
  }
  formatDate(d: any): string {
    if (!d) return '∞';
    try { return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return '–'; }
  }

  // ─── Pagination ───────────────────────────────────────────────────────────
  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages || page === this.currentPage) return;
    this.pageChange.emit(page);
  }
  get pageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(0, this.currentPage - 2);
    const end = Math.min(this.totalPages - 1, this.currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  // ─── Context Menu ─────────────────────────────────────────────────────────
  onMenuClick(event: MouseEvent, contract: Contract): void {
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

  onRightClick(event: MouseEvent, contract: Contract): void {
    event.preventDefault(); event.stopPropagation();
    this.contextMenuContract = contract;
    this.contextMenuPosition = {
      x: Math.max(4, Math.min(event.clientX, window.innerWidth - 224)),
      y: this.calcMenuY(event.clientY, event.clientY)
    };
    this.contextMenuVisible = true;
  }

  private calcMenuY(bottom: number, top: number): number {
    const menuH = 260;
    const spaceBelow = window.innerHeight - bottom;
    return spaceBelow >= menuH ? Math.max(4, bottom + 4) : Math.max(4, top - menuH - 4);
  }

  onAction(action: string): void {
    if (!this.contextMenuContract) return;
    this.contractAction.emit({ action, contract: this.contextMenuContract });
    this.closeMenu();
  }
  closeMenu(): void { this.contextMenuVisible = false; this.contextMenuContract = null; }

  @HostListener('document:click') onDocClick(): void { if (this.contextMenuVisible) this.closeMenu(); }
  @HostListener('document:keydown.escape') onEsc(): void { if (this.contextMenuVisible) this.closeMenu(); }
  @HostListener('window:resize') onResize(): void { if (this.contextMenuVisible) this.closeMenu(); }
}
