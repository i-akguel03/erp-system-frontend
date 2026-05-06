import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SortPipe } from '../../shared/pipes/sort.pipe';
import { SortState } from '../../shared/utils/sort-state';
import { Contract } from '../../models/Contract';
import { ContractService } from '../../services/contract-service';
import { Customer } from '../../models/Customer';
import { CustomerService } from '../../services/customer-service';
import { ConfirmationService } from 'primeng/api';
import { NotificationService } from '../../services/notification.service';
import { Dialog } from 'primeng/dialog';

@Component({
  selector: 'app-contract-list',
  standalone: true,
  imports: [CommonModule, FormsModule, Dialog, SortPipe],
  templateUrl: './contract-list.html',
  styleUrls: ['./contract-list.scss'],
})
export class ContractListComponent implements OnInit {
  sort = new SortState();
  contracts: Contract[] = [];
  filteredContracts: Contract[] = [];
  loading = false;
  error: string | null = null;
  searchTerm: string = '';

  customers: Customer[] = [];

  newContract: Contract = this.createEmptyContract();
  editContract: Contract = this.createEmptyContract();

  // Zusätzliche String-Properties für Datums-Bindings
  newStartDateString: string = '';
  newEndDateString: string = '';
  editStartDateString: string = '';
  editEndDateString: string = '';

  showNewModal = false;
  showEditModal = false;
  showTerminateModal = false;

  contractToTerminate: Contract | null = null;
  terminationDate: string = '';

  constructor(
    private contractService: ContractService,
    private customerService: CustomerService,
    private confirmationService: ConfirmationService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
    this.loadContracts();
  }

  // --- Load Methods ---
  loadContracts(): void {
    this.loading = true;
    this.error = null;
    this.contractService.getContracts(false).subscribe({
      next: data => {
        this.contracts = data;
        this.filteredContracts = [...this.contracts];
        this.loading = false;
      },
      error: err => this.handleApiError(err, 'Fehler beim Laden der Verträge')
    });
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: data => {
        console.log('Geladene Kunden:', data); // Debug-Log
        this.customers = data;
      },
      error: err => this.handleApiError(err, 'Fehler beim Laden der Kunden')
    });
  }

  filterContracts(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredContracts = this.contracts.filter(c => {
      const customer = this.getCustomerById(c.customerId);
      const customerString = customer ? `${customer.firstName} ${customer.lastName} ${customer.customerNumber}` : '';
      return (c.contractNumber?.toLowerCase().includes(term)) ||
             (c.contractTitle?.toLowerCase().includes(term)) ||
             (c.contractStatus?.toLowerCase().includes(term)) ||
             customerString.toLowerCase().includes(term);
    });
  }

  deleteContract(id?: string): void {
    if (!id) return;
    this.confirmationService.confirm({
      message: 'Möchten Sie diesen Vertrag wirklich löschen?',
      header: 'Vertrag löschen',
      icon: 'pi pi-trash',
      acceptLabel: 'Löschen',
      rejectLabel: 'Abbrechen',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.contractService.deleteContract(id).subscribe({
          next: () => {
            this.contracts = this.contracts.filter(c => c.id !== id);
            this.filterContracts();
            this.notification.success('Vertrag wurde erfolgreich gelöscht.');
          },
          error: err => this.handleApiError(err, 'Fehler beim Löschen des Vertrags')
        });
      }
    });
  }

  // --- Modal Management ---
  openNewModal(): void {
    this.showNewModal = true;
    this.error = null;
    this.newContract = this.createEmptyContract();
    // Setze Default-Datum Strings
    this.newStartDateString = this.formatDateForInput(this.newContract.startDate);
    this.newEndDateString = this.newContract.endDate ? this.formatDateForInput(this.newContract.endDate) : '';
  }

  closeNewModal(): void { 
    this.showNewModal = false; 
  }

  openEditModal(contract: Contract): void {
    this.editContract = { ...contract };
    this.showEditModal = true;
    this.error = null;
    
    // Konvertiere Datumsfelder für Input-Felder
    this.editStartDateString = this.formatDateForInput(contract.startDate);
    this.editEndDateString = contract.endDate ? this.formatDateForInput(contract.endDate) : '';
  }

  closeEditModal(): void { 
    this.showEditModal = false; 
  }

  openTerminateModal(contract: Contract): void {
    this.contractToTerminate = contract;
    this.terminationDate = '';
    this.showTerminateModal = true;
    this.error = null;
  }

  closeTerminateModal(): void {
    this.showTerminateModal = false;
    this.contractToTerminate = null;
    this.terminationDate = '';
  }

  // --- CRUD Operations ---
  createContract(): void {
    // Konvertiere Datum-Strings zu Date-Objekten
    const contractToSend = { 
      ...this.newContract,
      startDate: this.newStartDateString ? new Date(this.newStartDateString) : new Date(),
      endDate: this.newEndDateString ? new Date(this.newEndDateString) : undefined
    };

    if (!contractToSend.customerId || contractToSend.customerId.trim() === '') {
      this.error = 'Bitte wählen Sie einen Kunden aus.';
      return;
    }

    console.log('Erstelle Vertrag:', contractToSend); // Debug-Log

    this.contractService.createContract(contractToSend).subscribe({
      next: created => {
        this.contracts.push(created);
        this.filteredContracts = [...this.contracts];
        this.closeNewModal();
      },
      error: err => this.handleApiError(err, 'Fehler beim Erstellen des Vertrags')
    });
  }

  updateContract(): void {
    if (!this.editContract.id) return;

    if (!this.editContract.customerId || this.editContract.customerId.trim() === '') {
      this.error = 'Bitte wählen Sie einen Kunden aus.';
      return;
    }

    // Konvertiere Datum-Strings zu Date-Objekten
    const contractToUpdate = {
      ...this.editContract,
      startDate: this.editStartDateString ? new Date(this.editStartDateString) : new Date(),
      endDate: this.editEndDateString ? new Date(this.editEndDateString) : undefined
    };

    console.log('Aktualisiere Vertrag:', contractToUpdate); // Debug-Log

    this.contractService.updateContract(this.editContract.id, contractToUpdate).subscribe({
      next: updated => {
        this.updateLocalContract(updated);
        this.closeEditModal();
      },
      error: err => this.handleApiError(err, 'Fehler beim Aktualisieren des Vertrags')
    });
  }

  // --- Status Changes ---
  activateContract(contractId: string): void {
    if (!contractId) return;
    this.contractService.activateContract(contractId).subscribe({
      next: updated => this.updateLocalContract(updated),
      error: err => this.handleApiError(err, 'Fehler beim Aktivieren')
    });
  }

  suspendContract(contractId: string): void {
    if (!contractId) return;
    this.contractService.suspendContract(contractId).subscribe({
      next: updated => this.updateLocalContract(updated),
      error: err => this.handleApiError(err, 'Fehler beim Suspendieren')
    });
  }

  terminateContract(contractId: string, terminationDate?: string): void {
    if (!contractId) return;
    this.contractService.terminateContract(contractId, terminationDate).subscribe({
      next: updated => this.updateLocalContract(updated),
      error: err => this.handleApiError(err, 'Fehler beim Kündigen des Vertrags')
    });
  }

  // --- Helper Methods ---
  private updateLocalContract(updated: Contract): void {
    const index = this.contracts.findIndex(c => c.id === updated.id);
    if (index >= 0) {
      this.contracts[index] = updated;
      this.filteredContracts = [...this.contracts];
    }
  }

  private handleApiError(err: any, defaultMessage: string): void {
    console.error('API Error:', err);
    this.loading = false;
    this.error = err.error?.message || defaultMessage;
  }

  private createEmptyContract(): Contract {
    return { 
      contractTitle: '', 
      contractStatus: 'DRAFT', 
      startDate: new Date(), 
      subscriptions: [], 
      customerId: '' 
    };
  }

  private formatDateForInput(date: Date | string | undefined): string {
    if (!date) return '';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    
    return d.toISOString().split('T')[0];
  }

  getCustomerById(customerId?: string): Customer | undefined {
    return this.customers.find(c => c.id === customerId);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'bg-success';
      case 'SUSPENDED': return 'bg-warning';
      case 'TERMINATED': return 'bg-danger';
      case 'DRAFT': return 'bg-secondary';
      default: return 'bg-light';
    }
  }

  canActivate(contract: Contract): boolean {
    return contract.contractStatus === 'DRAFT' || contract.contractStatus === 'SUSPENDED';
  }

  canSuspend(contract: Contract): boolean {
    return contract.contractStatus === 'ACTIVE';
  }

  canTerminate(contract: Contract): boolean {
    return contract.contractStatus === 'ACTIVE' || contract.contractStatus === 'SUSPENDED';
  }

  canEdit(contract: Contract): boolean {
    return contract.contractStatus !== 'TERMINATED';
  }

  clearError(): void { 
    this.error = null; 
  }
}