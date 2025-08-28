import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Contract } from '../../models/Contract';
import { ContractService } from '../../services/contract-service';

@Component({
  selector: 'app-contract-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contract-list.html',
  styleUrls: ['./contract-list.scss'],
})
export class ContractListComponent implements OnInit {
  contracts: Contract[] = [];
  filteredContracts: Contract[] = [];
  loading = false;
  error: string | null = null;
  searchTerm: string = '';

  // Neue Verträge
  newContract: Contract = { contractTitle: '', status: 'DRAFT', subscriptions: [] };

  // Bearbeiten
  editContract: Contract = { contractTitle: '', status: '', subscriptions: [] };

  showNewModal = false;
  showEditModal = false;

  constructor(private contractService: ContractService) {}

  ngOnInit(): void {
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

  filterContracts(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredContracts = this.contracts.filter(c =>
      (c.contractNumber?.toLowerCase().includes(term)) ||
      (c.contractTitle?.toLowerCase().includes(term)) ||
      (c.status?.toLowerCase().includes(term))
    );
  }

  deleteContract(id?: string): void {
    if (!id) return;
    if (!confirm('Möchten Sie diesen Vertrag wirklich löschen?')) return;

    this.contractService.deleteContract(id).subscribe({
      next: () => {
        this.contracts = this.contracts.filter(c => c.id !== id);
        this.filterContracts();
      },
      error: err => this.handleApiError(err, 'Fehler beim Löschen des Vertrags')
    });
  }

  openNewModal(): void { this.showNewModal = true; }
  closeNewModal(): void { this.showNewModal = false; }

  createContract(): void {
    const contractToSend = { ...this.newContract };
    delete (contractToSend as any).id;

    this.contractService.createContract(contractToSend).subscribe({
      next: created => {
        this.contracts.push(created);
        this.filteredContracts = [...this.contracts];
        this.newContract = { contractTitle: '', status: 'DRAFT', subscriptions: [] };
        this.closeNewModal();
      },
      error: err => this.handleApiError(err, 'Fehler beim Erstellen des Vertrags')
    });
  }

  openEditModal(contract: Contract): void {
    this.editContract = JSON.parse(JSON.stringify(contract));
    this.showEditModal = true;
  }

  closeEditModal(): void { this.showEditModal = false; }

  updateContract(): void {
    if (!this.editContract.id) return;

    this.contractService.updateContract(this.editContract.id, this.editContract).subscribe({
      next: updated => {
        const index = this.contracts.findIndex(c => c.id === updated.id);
        if (index >= 0) this.contracts[index] = updated;
        this.filteredContracts = [...this.contracts];
        this.closeEditModal();
      },
      error: err => this.handleApiError(err, 'Fehler beim Aktualisieren des Vertrags')
    });
  }

  activateContract(id: string): void {
    this.contractService.activateContract(id).subscribe({
      next: updated => this.updateLocalContract(updated),
      error: err => this.handleApiError(err, 'Fehler beim Aktivieren')
    });
  }

  suspendContract(id: string): void {
    this.contractService.suspendContract(id).subscribe({
      next: updated => this.updateLocalContract(updated),
      error: err => this.handleApiError(err, 'Fehler beim Suspendieren')
    });
  }

  private updateLocalContract(updated: Contract) {
    const index = this.contracts.findIndex(c => c.id === updated.id);
    if (index >= 0) this.contracts[index] = updated;
    this.filteredContracts = [...this.contracts];
  }

  private handleApiError(err: any, defaultMessage: string): void {
    console.error('API Error:', err);
    if (err.status === 401) this.error = 'Login abgelaufen. Bitte neu einloggen.';
    else if (err.status === 403) this.error = 'Zugriff verweigert.';
    else this.error = defaultMessage;
  }
}
