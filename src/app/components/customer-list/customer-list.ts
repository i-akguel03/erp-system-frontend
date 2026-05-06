import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Customer } from '../../models/Customer';
import { CustomerService } from '../../services/customer-service';
import { ErpService } from '../../services/testservice';
import { ConfirmationService } from 'primeng/api';
import { NotificationService } from '../../services/notification.service';
import { Dialog } from 'primeng/dialog';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    Dialog
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
  residentialAddress: { street: '', postalCode: '', city: '', country: '' },
  billingAddress: { street: '', postalCode: '', city: '', country: '' },
  shippingAddress: { street: '', postalCode: '', city: '', country: '' }
};

// Formular-Model für Bearbeiten
editCustomer: Customer = {
  id: '',
  customerNumber: '',
  firstName: '',
  lastName: '',
  email: '',
  tel: '',
  residentialAddress: { street: '', postalCode: '', city: '', country: '' },
  billingAddress: { street: '', postalCode: '', city: '', country: '' },
  shippingAddress: { street: '', postalCode: '', city: '', country: '' }
};


  // Modal-Steuerung
  showNewModal = false;
  showEditModal = false;
  message: string | null = null;

  constructor(
    private customerService: CustomerService,
    private router: Router,
    private initService: ErpService,
    private confirmationService: ConfirmationService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.checkTokenAndLoad();
  }

  private checkTokenAndLoad(): void {
    // if (!this.customerService.isAuthenticated()) {
    //   this.error = 'Kein gültiges Login-Token vorhanden. Bitte loggen Sie sich ein.';
    //   return;
    // }
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
      (c.residentialAddress?.street.toLowerCase().includes(term))
    );
  }

  deleteCustomer(id?: string): void {
    if (!id) return;
    this.confirmationService.confirm({
      message: 'Möchten Sie diesen Kunden wirklich löschen?',
      header: 'Kunden löschen',
      icon: 'pi pi-trash',
      acceptLabel: 'Löschen',
      rejectLabel: 'Abbrechen',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.customerService.deleteCustomer(id).subscribe({
          next: () => {
            this.customers = this.customers.filter(c => c.id !== id);
            this.filterCustomers();
            this.notification.success('Kunde wurde erfolgreich gelöscht.');
          },
          error: (err) => {
            if (err.status === 404) {
              this.notification.warn('Der Kunde wurde nicht gefunden (evtl. bereits gelöscht).');
            } else if (err.status === 409) {
              this.notification.error('Der Kunde kann nicht gelöscht werden, da aktive Verträge existieren.');
            } else {
              this.handleApiError(err, 'Fehler beim Löschen des Kunden');
            }
          }
        });
      }
    });
  }

  initTestData() {
    this.loading = true;
    this.message = null;

    this.initService.initTestDB().subscribe({
      next: (response) => {
        this.message = response;
        this.loading = false;
      },
      error: (err) => {
        this.message = 'Fehler: ' + (err.error || err.message);
        this.loading = false;
      }
    });
  }

  // --- Neuer Kunde ---
  openNewModal(): void { this.showNewModal = true; }
  closeNewModal(): void { this.showNewModal = false; }

  createCustomer(): void {
    const customerToSend = { ...this.newCustomer };
    delete (customerToSend as any).id;

    this.customerService.createCustomer(customerToSend).subscribe({
      next: (created) => {
        this.customers.push(created);
        this.filteredCustomers = [...this.customers];
        this.newCustomer = {
          firstName: '',
          lastName: '',
          email: '',
          tel: '',
          residentialAddress: { street: '', postalCode: '', city: '', country: '' },
          billingAddress: { street: '', postalCode: '', city: '', country: '' },
          shippingAddress: { street: '', postalCode: '', city: '', country: '' }
        };
        this.closeNewModal();
      },
      error: (err) => this.handleApiError(err, 'Fehler beim Erstellen des Kunden')
    });
  }

  // --- Bearbeiten ---
  openEditModal(customer: Customer): void {
    this.editCustomer = JSON.parse(JSON.stringify(customer)); // deep copy
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
      { firstName: 'Max', lastName: 'Mustermann', email: 'max@example.com', tel: '123456789', residentialAddress: { street: 'Wohnung 1', postalCode: '', city: '', country: '' }, customerNumber: 'C001' },
      { firstName: 'Anna', lastName: 'Müller', email: 'anna@example.com', tel: '987654321', residentialAddress: { street: 'Wohnung 2', postalCode: '', city: '', country: '' }, customerNumber: 'C002' },
      { firstName: 'Peter', lastName: 'Schmidt', email: 'peter@example.com', tel: '555555555', residentialAddress: { street: 'Wohnung 3', postalCode: '', city: '', country: '' }, customerNumber: 'C003' },
      { firstName: 'Laura', lastName: 'Meier', email: 'laura@example.com', tel: '444444444', residentialAddress: { street: 'Wohnung 4', postalCode: '', city: '', country: '' }, customerNumber: 'C004' },
      { firstName: 'Tom', lastName: 'Klein', email: 'tom@example.com', tel: '333333333', residentialAddress: { street: 'Wohnung 5', postalCode: '', city: '', country: '' }, customerNumber: 'C005' }
    ];

    testCustomers.forEach(cust => {
      const customerToSend = { ...cust };
      delete (customerToSend as any).id;
      this.customerService.createCustomer(customerToSend).subscribe({
        next: (created) => {
          this.customers.push(created);
          this.filterCustomers();
        },
        error: (err) => this.handleApiError(err, 'Fehler beim Erstellen von Testdaten')
      });
    });
  }

  clearError(): void {
    this.error = null;
  }

  logout(): void {
    this.customers = [];
    this.filteredCustomers = [];
    this.error = 'Abgemeldet. Bitte loggen Sie sich erneut ein.';
  }
}
