import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
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
  loading = false;
  error: string | null = null;
  checked = false;

  // Formular-Model für neuen Kunden
  newCustomer: Customer = {
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    tel: '',
    residentialAddressId: ''
  };

  // Formular-Model für Bearbeiten
  editCustomer: Customer = {
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    tel: '',
    residentialAddressId: ''
  };

  // Modal-Steuerung
  showNewModal = false;
  showEditModal = false;

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    this.customerService.getCustomers().subscribe({
      next: (data) => {
        this.customers = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Fehler beim Laden der Kunden';
        console.error(err);
        this.loading = false;
      },
    });
  }

  deleteCustomer(id?: string): void {
    if (!id) return;
    if (confirm('Möchten Sie diesen Kunden wirklich löschen?')) {
      this.customerService.deleteCustomer(id).subscribe({
        next: () => {
          this.customers = this.customers.filter(c => c.id !== id);
        },
        error: (err) => {
          this.error = 'Fehler beim Löschen des Kunden';
          console.error(err);
        }
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
        this.newCustomer = { firstName: '', lastName: '', email: '', tel: '', residentialAddressId: '' };
        this.closeNewModal();
      },
      error: (err) => {
        this.error = 'Fehler beim Erstellen des Kunden';
        console.error(err);
      }
    });
  }

  // --- Bearbeiten ---
  openEditModal(customer: Customer): void {
    this.editCustomer = { ...customer }; // Kopie erstellen
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

  updateCustomer(): void {
    if (!this.editCustomer.id) return;
    this.customerService.updateCustomer(this.editCustomer.id, this.editCustomer).subscribe({
      next: (updated) => {
        const index = this.customers.findIndex(c => c.id === updated.id);
        if (index > -1) this.customers[index] = updated;
        this.closeEditModal();
      },
      error: (err) => {
        this.error = 'Fehler beim Aktualisieren des Kunden';
        console.error(err);
      }
    });
  }

  generateTestData(): void {
  const testCustomers: Customer[] = [
    { firstName: 'Max', lastName: 'Mustermann', email: 'max@example.com', tel: '123456789', residentialAddressId: 'Wohnung 1' },
    { firstName: 'Anna', lastName: 'Müller', email: 'anna@example.com', tel: '987654321', residentialAddressId: 'Wohnung 2' },
    { firstName: 'Peter', lastName: 'Schmidt', email: 'peter@example.com', tel: '555555555', residentialAddressId: 'Wohnung 3' },
    { firstName: 'Laura', lastName: 'Meier', email: 'laura@example.com', tel: '444444444', residentialAddressId: 'Wohnung 4' },
    { firstName: 'Tom', lastName: 'Klein', email: 'tom@example.com', tel: '333333333', residentialAddressId: 'Wohnung 5' }
  ];

  testCustomers.forEach(cust => {
    const customerToSend = { ...cust };
    delete customerToSend.id; // ID nicht mitsenden
    this.customerService.createCustomer(customerToSend).subscribe({
      next: (created) => {
        this.customers.push(created);
      },
      error: (err) => {
        console.error('Fehler beim Erstellen von Testdaten', err);
      }
    });
  });
}
}
