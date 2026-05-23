import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SortPipe } from '../../shared/pipes/sort.pipe';
import { ListBase } from '../../shared/utils/list-base';
import { ListToolbarComponent } from '../../shared/components/list-toolbar/list-toolbar.component';
import { ListStatusComponent } from '../../shared/components/list-status/list-status.component';
import { AddressService } from '../../services/address-service';
import { Address } from '../../models/Address';
import { ConfirmationService } from 'primeng/api';
import { NotificationService } from '../../services/notification.service';
import { Dialog } from 'primeng/dialog';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-address-list',
  standalone: true,
  imports: [CommonModule, FormsModule, Dialog, SortPipe, ListToolbarComponent, ListStatusComponent, PaginationComponent],
  templateUrl: './address-list.html',
  styleUrls: ['./address-list.scss'],
})
export class AddressListComponent extends ListBase<Address> implements OnInit {
  addresses: Address[] = [];
  filteredAddresses: Address[] = [];

  newAddress: Address = this.createEmptyAddress();
  editAddress: Address = this.createEmptyAddress();

  constructor(
    private addressService: AddressService,
    private confirmationService: ConfirmationService,
    private notification: NotificationService
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadAddresses();
  }

  loadAddresses(): void {
    this.loading = true;
    this.error = null;
    this.addressService.getAddressesPagedResult(this.currentPage, this.pageSize).subscribe({
      next: result => {
        this.addresses = result.content;
        this.filteredAddresses = [...this.addresses];
        this.totalElements = result.totalElements;
        this.totalPages = result.totalPages;
        this.currentPage = result.currentPage;
        this.loading = false;
      },
      error: err => this.handleApiError(err, 'Fehler beim Laden der Adressen')
    });
  }

  protected loadPage(): void { this.loadAddresses(); }

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

  override openNewModal(): void {
    super.openNewModal();
    this.newAddress = this.createEmptyAddress();
  }

  openEditModal(address: Address): void {
    this.editAddress = { ...address };
    this.showEditModal = true;
    this.error = null;
  }

  createAddress(): void {
    if (this.saving) return;
    this.saving = true;
    this.addressService.createAddress(this.newAddress).subscribe({
      next: created => {
        this.addresses.push(created);
        this.filteredAddresses = [...this.addresses];
        this.saving = false;
        this.closeNewModal();
        this.notification.success('Adresse wurde erfolgreich erstellt.');
      },
      error: err => this.handleApiError(err, 'Fehler beim Erstellen der Adresse')
    });
  }

  updateAddress(): void {
    if (!this.editAddress.id || this.saving) return;
    this.saving = true;
    this.addressService.updateAddress(this.editAddress.id, this.editAddress).subscribe({
      next: updated => {
        const index = this.addresses.findIndex(a => a.id === updated.id);
        if (index >= 0) this.addresses[index] = updated;
        this.filteredAddresses = [...this.addresses];
        this.saving = false;
        this.closeEditModal();
        this.notification.success('Adresse wurde erfolgreich aktualisiert.');
      },
      error: err => this.handleApiError(err, 'Fehler beim Aktualisieren der Adresse')
    });
  }

  private createEmptyAddress(): Address {
    return { id: 0, street: '', postalCode: '', city: '', country: '' };
  }
}
