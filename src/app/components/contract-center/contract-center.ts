import { Component, OnInit } from '@angular/core';
import { Contract } from '../../models/Contract';
import { Subscription } from '../../models/Subscription';
import { ContractService } from '../../services/contract-service';
import { SubscriptionService } from '../../services/subscription-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contract-center',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contract-center.html',
  styleUrls: ['./contract-center.scss']
})
export class ContractCenterComponent implements OnInit {

  contracts: Contract[] = [];
  filteredContracts: Contract[] = [];
  selectedContract: Contract | null = null;
  subscriptions: Subscription[] = [];

  searchTerm: string = '';
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private contractService: ContractService,
    private subscriptionService: SubscriptionService
  ) {}

  ngOnInit(): void {
    this.loadContracts();
  }

  loadContracts(): void {
    this.loading = true;
    this.contractService.getContracts(false).subscribe({
      next: data => {
        this.contracts = data;
        this.filteredContracts = [...this.contracts];
        this.loading = false;
      },
      error: err => {
        this.error = 'Fehler beim Laden der Verträge';
        this.loading = false;
      }
    });
  }

  filterContracts(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredContracts = this.contracts.filter(c =>
      c.contractTitle?.toLowerCase().includes(term) ||
      c.contractNumber?.toLowerCase().includes(term)
    );
  }

  selectContract(contract: Contract): void {
    this.selectedContract = contract;
    this.subscriptionService.getSubscriptionsByContract(contract.id!).subscribe({
      next: subs => this.subscriptions = subs,
      error: err => this.subscriptions = []
    });
  }

  isSelected(contract: Contract): boolean {
    return this.selectedContract?.id === contract.id;
  }
}
