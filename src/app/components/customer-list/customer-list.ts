import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Customer, CustomerService } from '../../services/services/customer';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule
  ],
  templateUrl: './customer-list.html',
  styleUrls: ['./customer-list.scss'],
})
export class CustomerListComponent implements OnInit {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  loading = false;
  error: string | null = null;
  searchTerm: string = '';

  // Formular-Model für neuen Kunden
  newCustomer: Customer = {
    id: '',
    customerNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    tel: '',
    residentialAddressId: ''
  };

  // Formular-Model für Bearbeiten
  editCustomer: Customer = {
    id: '',
    customerNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    tel: '',
    residentialAddressId: ''
  };

  // Modal-Steuerung
  showNewModal = false;
  showEditModal = false;

  constructor(
    private customerService: CustomerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkTokenAndLoad();
  }

  private checkTokenAndLoad(): void {
    if (!this.customerService.hasValidToken()) {
      this.error = 'Kein gültiges Login-Token vorhanden. Bitte loggen Sie sich ein.';
      return;
    }
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    this.error = null;

    this.customerService.getCustomers().subscribe({
      next: (data) => {
        this.customers = data;
        this.filteredCustomers = [...this.customers];
        this.loading = false;
      },
      error: (err) => {
        this.handleApiError(err, 'Fehler beim Laden der Kunden');
        this.loading = false;
      }
    });
  }

  filterCustomers(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredCustomers = this.customers.filter(c =>
      (c.customerNumber?.toLowerCase().includes(term)) ||
      (c.firstName?.toLowerCase().includes(term)) ||
      (c.lastName?.toLowerCase().includes(term)) ||
      (c.tel?.toLowerCase().includes(term)) ||
      (c.residentialAddressId?.toLowerCase().includes(term))
    );
  }

  deleteCustomer(id?: string): void {
    if (!id) return;
    if (confirm('Möchten Sie diesen Kunden wirklich löschen?')) {
      this.customerService.deleteCustomer(id).subscribe({
        next: () => {
          this.customers = this.customers.filter(c => c.id !== id);
          this.filterCustomers();
        },
        error: (err) => this.handleApiError(err, 'Fehler beim Löschen des Kunden')
      });
    }
  }

  // --- Neuer Kunde ---
  openNewModal(): void { this.showNewModal = true; }
  closeNewModal(): void { this.showNewModal = false; }

  createCustomer(): void {
    const customerToSend = { ...this.newCustomer };
    delete customerToSend.id;

    this.customerService.createCustomer(customerToSend).subscribe({
      next: (created) => {
        this.customers.push(created);
        this.filteredCustomers = [...this.customers];
        this.newCustomer = { id: '', customerNumber: '', firstName: '', lastName: '', email: '', tel: '', residentialAddressId: '' };
        this.closeNewModal();
      },
      error: (err) => this.handleApiError(err, 'Fehler beim Erstellen des Kunden')
    });
  }

  // --- Bearbeiten ---
  openEditModal(customer: Customer): void {
    this.editCustomer = { ...customer };
    this.showEditModal = true;
  }

  closeEditModal(): void { this.showEditModal = false; }

  updateCustomer(): void {
    if (!this.editCustomer.id) return;

    this.customerService.updateCustomer(this.editCustomer.id, this.editCustomer).subscribe({
      next: (updated) => {
        const index = this.customers.findIndex(c => c.id === updated.id);
        if (index > -1) this.customers[index] = updated;
        this.filteredCustomers = [...this.customers];
        this.closeEditModal();
      },
      error: (err) => this.handleApiError(err, 'Fehler beim Aktualisieren des Kunden')
    });
  }

  private handleApiError(err: any, defaultMessage: string): void {
    console.error('API Error:', err);
    if (err.status === 401) this.error = 'Login abgelaufen. Bitte loggen Sie sich neu ein.';
    else if (err.status === 403) this.error = 'Zugriff verweigert. Sie haben keine Berechtigung für diese Aktion.';
    else this.error = defaultMessage;
  }

  generateTestData(): void {
    const testCustomers: Customer[] = [
      { firstName: 'Max', lastName: 'Mustermann', email: 'max@example.com', tel: '123456789', residentialAddressId: 'Wohnung 1', customerNumber: 'C001' },
      { firstName: 'Anna', lastName: 'Müller', email: 'anna@example.com', tel: '987654321', residentialAddressId: 'Wohnung 2', customerNumber: 'C002' },
      { firstName: 'Peter', lastName: 'Schmidt', email: 'peter@example.com', tel: '555555555', residentialAddressId: 'Wohnung 3', customerNumber: 'C003' },
      { firstName: 'Laura', lastName: 'Meier', email: 'laura@example.com', tel: '444444444', residentialAddressId: 'Wohnung 4', customerNumber: 'C004' },
      { firstName: 'Tom', lastName: 'Klein', email: 'tom@example.com', tel: '333333333', residentialAddressId: 'Wohnung 5', customerNumber: 'C005' }
    ];

    testCustomers.forEach(cust => {
      const customerToSend = { ...cust };
      delete customerToSend.id;
      this.customerService.createCustomer(customerToSend).subscribe({
        next: (created) => {
          this.customers.push(created);
          this.filterCustomers();
        },
        error: (err) => this.handleApiError(err, 'Fehler beim Erstellen von Testdaten')
      });
    });
  }

  logout(): void {
    this.customers = [];
    this.filteredCustomers = [];
    this.error = 'Abgemeldet. Bitte loggen Sie sich erneut ein.';
  }
}
