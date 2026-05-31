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

  @Output() customerSelected = new EventEmitter<Customer>();
  @Output() retry = new EventEmitter<void>();

  searchTerm = '';
  filtered: Customer[] = [];

  ngOnChanges(): void {
    this.applyFilter();
  }

  applyFilter(): void {
    const q = this.searchTerm.toLowerCase().trim();
    if (!q) {
      this.filtered = [...this.customers];
      return;
    }
    this.filtered = this.customers.filter(c =>
      c.firstName?.toLowerCase().includes(q) ||
      c.lastName?.toLowerCase().includes(q) ||
      c.customerNumber?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.tel?.toLowerCase().includes(q)
    );
  }

  select(customer: Customer): void {
    this.customerSelected.emit(customer);
  }

  isSelected(customer: Customer): boolean {
    return this.selectedCustomer?.id === customer.id;
  }

  getInitials(customer: Customer): string {
    return ((customer.firstName?.[0] ?? '') + (customer.lastName?.[0] ?? '')).toUpperCase();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }
}
