import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SortPipe } from '../../shared/pipes/sort.pipe';
import { SortState } from '../../shared/utils/sort-state';
import { AddressService } from '../../services/address-service';
import { Address } from '../../models/Address';
import { ConfirmationService } from 'primeng/api';
import { NotificationService } from '../../services/notification.service';
import { Dialog } from 'primeng/dialog';

@Component({
  selector: 'app-address-list',
  standalone: true,
  imports: [CommonModule, FormsModule, Dialog, SortPipe],
  templateUrl: './address-list.html',
  styleUrls: ['./address-list.scss'],
})
export class AddressListComponent implements OnInit {
  sort = new SortState();
  addresses: Address[] = [];
  filteredAddresses: Address[] = [];
  loading = false;
  error: string | null = null;
  searchTerm: string = '';

  newAddress: Address = this.createEmptyAddress();
  editAddress: Address = this.createEmptyAddress();

  showNewModal = false;
  showEditModal = false;

  constructor(
    private addressService: AddressService,
    private confirmationService: ConfirmationService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadAddresses();
  }

  // --- Load Methods ---
  loadAddresses(): void {
    this.loading = true;
    this.error = null;
    this.addressService.getAllAddresses().subscribe({
      next: data => {
        this.addresses = data;
        this.filteredAddresses = [...this.addresses];
        this.loading = false;
      },
      error: err => this.handleApiError(err, 'Fehler beim Laden der Adressen')
    });
  }

  filterAddresses(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredAddresses = this.addresses.filter(addr => 
      addr.street.toLowerCase().includes(term) ||
      addr.city.toLowerCase().includes(term) ||
      addr.postalCode.toLowerCase().includes(term) ||
      addr.country.toLowerCase().includes(term)
    );
  }

  deleteAddress(id?: number): void {
    if (!id) return;
    this.confirmationService.confirm({
      message: 'Möchten Sie diese Adresse wirklich löschen?',
      header: 'Adresse löschen',
      icon: 'pi pi-trash',
      acceptLabel: 'Löschen',
      rejectLabel: 'Abbrechen',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.addressService.deleteAddress(id).subscribe({
          next: () => {
            this.addresses = this.addresses.filter(a => a.id !== id);
            this.filterAddresses();
            this.notification.success('Adresse wurde erfolgreich gelöscht.');
          },
          error: err => this.handleApiError(err, 'Fehler beim Löschen der Adresse')
        });
      }
    });
  }

  // --- Modal Management ---
  openNewModal(): void {
    this.showNewModal = true;
    this.error = null;
    this.newAddress = this.createEmptyAddress();
  }

  closeNewModal(): void { this.showNewModal = false; }

  openEditModal(address: Address): void {
    this.editAddress = { ...address };
    this.showEditModal = true;
    this.error = null;
  }

  closeEditModal(): void { this.showEditModal = false; }

  // --- CRUD Operations ---
  createAddress(): void {
    this.addressService.createAddress(this.newAddress).subscribe({
      next: created => {
        this.addresses.push(created);
        this.filteredAddresses = [...this.addresses];
        this.closeNewModal();
      },
      error: err => this.handleApiError(err, 'Fehler beim Erstellen der Adresse')
    });
  }

  updateAddress(): void {
    if (!this.editAddress.id) return;
    this.addressService.updateAddress(this.editAddress.id, this.editAddress).subscribe({
      next: updated => {
        const index = this.addresses.findIndex(a => a.id === updated.id);
        if (index >= 0) this.addresses[index] = updated;
        this.filteredAddresses = [...this.addresses];
        this.closeEditModal();
      },
      error: err => this.handleApiError(err, 'Fehler beim Aktualisieren der Adresse')
    });
  }

  // --- Helper Methods ---
  private handleApiError(err: any, defaultMessage: string): void {
    console.error('API Error:', err);
    this.loading = false;
    this.error = err.error?.message || defaultMessage;
  }

  private createEmptyAddress(): Address {
    return { id: 0, street: '', postalCode: '', city: '', country: '' };
  }
}
