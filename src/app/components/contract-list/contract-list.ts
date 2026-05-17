import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SortPipe } from '../../shared/pipes/sort.pipe';
import { ListBase } from '../../shared/utils/list-base';
import { ListToolbarComponent } from '../../shared/components/list-toolbar/list-toolbar.component';
import { ListStatusComponent } from '../../shared/components/list-status/list-status.component';
import { Contract } from '../../models/Contract';
import { ContractService } from '../../services/contract-service';
import { Customer } from '../../models/Customer';
import { CustomerService } from '../../services/customer-service';
import { ConfirmationService } from 'primeng/api';
import { NotificationService } from '../../services/notification.service';
import { EmailService } from '../../services/email.service';
import { Dialog } from 'primeng/dialog';

@Component({
  selector: 'app-contract-list',
  standalone: true,
  imports: [CommonModule, FormsModule, Dialog, SortPipe, ListToolbarComponent, ListStatusComponent],
  templateUrl: './contract-list.html',
  styleUrls: ['./contract-list.scss'],
})
export class ContractListComponent extends ListBase<Contract> implements OnInit {
  contracts: Contract[] = [];
  filteredContracts: Contract[] = [];

  customers: Customer[] = [];

  newContract: Contract = this.createEmptyContract();
  editContract: Contract = this.createEmptyContract();

  newStartDateString = '';
  newEndDateString = '';
  editStartDateString = '';
  editEndDateString = '';

  showTerminateModal = false;
  contractToTerminate: Contract | null = null;
  terminationDate = '';

  constructor(
    private contractService: ContractService,
    private customerService: CustomerService,
    private confirmationService: ConfirmationService,
    private notification: NotificationService,
    private emailService: EmailService
  ) {
    super();
  }

  emailSendingId: string | null = null;

  ngOnInit(): void {
    this.loadCustomers();
    this.loadContracts();
  }

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
        console.log('Geladene Kunden:', data);
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

  override openNewModal(): void {
    super.openNewModal();
    this.newContract = this.createEmptyContract();
    this.newStartDateString = this.formatDateForInput(this.newContract.startDate);
    this.newEndDateString = '';
  }

  openEditModal(contract: Contract): void {
    this.editContract = { ...contract };
    this.showEditModal = true;
    this.error = null;
    this.editStartDateString = this.formatDateForInput(contract.startDate);
    this.editEndDateString = contract.endDate ? this.formatDateForInput(contract.endDate) : '';
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

  createContract(): void {
    const contractToSend = {
      ...this.newContract,
      startDate: this.newStartDateString ? new Date(this.newStartDateString) : new Date(),
      endDate: this.newEndDateString ? new Date(this.newEndDateString) : undefined
    };
    if (!contractToSend.customerId || contractToSend.customerId.trim() === '') {
      this.error = 'Bitte wählen Sie einen Kunden aus.';
      return;
    }
    console.log('Erstelle Vertrag:', contractToSend);
    if (this.saving) return;
    this.saving = true;
    this.contractService.createContract(contractToSend).subscribe({
      next: created => {
        this.saving = false;
        this.contracts.push(created);
        this.filteredContracts = [...this.contracts];
        this.closeNewModal();
        this.notification.success('Vertrag erfolgreich erstellt.');
      },
      error: err => { this.handleApiError(err, 'Fehler beim Erstellen des Vertrags'); this.notification.error('Fehler beim Erstellen des Vertrags.'); }
    });
  }

  updateContract(): void {
    if (!this.editContract.id) return;
    if (!this.editContract.customerId || this.editContract.customerId.trim() === '') {
      this.error = 'Bitte wählen Sie einen Kunden aus.';
      return;
    }
    const contractToUpdate = {
      ...this.editContract,
      startDate: this.editStartDateString ? new Date(this.editStartDateString) : new Date(),
      endDate: this.editEndDateString ? new Date(this.editEndDateString) : undefined
    };
    console.log('Aktualisiere Vertrag:', contractToUpdate);
    if (this.saving) return;
    this.saving = true;
    this.contractService.updateContract(this.editContract.id, contractToUpdate).subscribe({
      next: updated => { this.saving = false; this.updateLocalContract(updated); this.closeEditModal(); this.notification.success('Vertrag erfolgreich aktualisiert.'); },
      error: err => { this.handleApiError(err, 'Fehler beim Aktualisieren des Vertrags'); this.notification.error('Fehler beim Aktualisieren des Vertrags.'); }
    });
  }

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

  private updateLocalContract(updated: Contract): void {
    const index = this.contracts.findIndex(c => c.id === updated.id);
    if (index >= 0) {
      this.contracts[index] = updated;
      this.filteredContracts = [...this.contracts];
    }
  }

  private createEmptyContract(): Contract {
    return { contractTitle: '', contractStatus: 'DRAFT', startDate: new Date(), subscriptions: [], customerId: '' };
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

  sendExpiryNotice(contract: Contract): void {
    if (!contract.id || this.emailSendingId === contract.id) return;
    this.emailSendingId = contract.id;
    this.emailService.sendContractExpiryNotice(contract.id).subscribe({
      next: () => { this.notification.success('Ablaufhinweis-E-Mail gesendet.'); this.emailSendingId = null; },
      error: () => { this.notification.error('E-Mail konnte nicht gesendet werden.'); this.emailSendingId = null; }
    });
  }
}
