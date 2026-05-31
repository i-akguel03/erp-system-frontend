import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Customer } from '../../../../models/Customer';

@Component({
  selector: 'app-customer-select-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-select-list.html',
  styleUrls: ['./customer-select-list.scss']
})
export class CustomerSelectListComponent implements OnChanges {
  @Input() customers: Customer[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() selectedCustomer: Customer | null = null;
  @Input() currentPage = 0;
  @Input() totalPages = 0;
  @Input() totalElements = 0;

  @Output() customerSelected = new EventEmitter<Customer>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() retry = new EventEmitter<void>();

  searchTerm = '';
  filtered: Customer[] = [];

  ngOnChanges(): void { this.applyFilter(); }

  applyFilter(): void {
    const q = this.searchTerm.toLowerCase().trim();
    this.filtered = !q ? [...this.customers] : this.customers.filter(c =>
      c.firstName?.toLowerCase().includes(q) ||
      c.lastName?.toLowerCase().includes(q) ||
      c.customerNumber?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  }

  select(c: Customer): void { this.customerSelected.emit(c); }
  isSelected(c: Customer): boolean { return this.selectedCustomer?.id === c.id; }
  clearSearch(): void { this.searchTerm = ''; this.applyFilter(); }

  getInitials(c: Customer): string {
    return ((c.firstName?.[0] ?? '') + (c.lastName?.[0] ?? '')).toUpperCase();
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages || page === this.currentPage) return;
    this.pageChange.emit(page);
  }

  get pageNumbers(): number[] {
    const pages = [];
    const start = Math.max(0, this.currentPage - 2);
    const end = Math.min(this.totalPages - 1, this.currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }
}
