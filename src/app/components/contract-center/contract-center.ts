import { Component, HostListener, OnInit } from '@angular/core';
import { Contract } from '../../models/Contract';
import { Subscription } from '../../models/Subscription';
import { ContractService } from '../../services/contract-service';
import { SubscriptionService } from '../../services/subscription-service';
import { DueScheduleService } from '../../services/due-schedule-service';
import { DueSchedule } from '../../models/DueSchedule';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CustomerService } from '../../services/customer-service';
import { Customer } from '../../models/Customer';

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
  selectedSubscription: Subscription | null = null;
  dueSchedules: DueSchedule[] = [];

  searchTerm: string = '';
  loading: boolean = false;
  error: string | null = null;

  // Kontextmenü-Variablen
  contextMenuVisible = false;
  contextMenuPosition = { x: 0, y: 0 };
  contextMenuContract: Contract | null = null;

  customers: { [id: string]: Customer } = {}; // Cache für Customer-Daten

  constructor(
    private contractService: ContractService,
    private subscriptionService: SubscriptionService,
    private dueScheduleService: DueScheduleService,
    private customerService: CustomerService
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

        // Lade die Customer-Daten für die Tabelle
        data.forEach(c => {
          if (c.customerId) {
            this.customerService.getCustomerById(c.customerId).subscribe({
              next: customer => this.customers[c.customerId!] = customer
            });
          }
        });

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
    this.subscriptions = [];
    this.selectedSubscription = null;
    this.dueSchedules = [];

    this.subscriptionService.getSubscriptionsByContract(contract.id!).subscribe({
      next: subs => this.subscriptions = subs,
      error: err => this.subscriptions = []
    });
  }

  selectSubscription(sub: Subscription): void {
    this.selectedSubscription = sub;
    this.dueSchedules = [];
    this.dueScheduleService.getDueSchedulesBySubscription(sub.id!).subscribe({
      next: schedules => this.dueSchedules = schedules,
      error: err => this.dueSchedules = []
    });
  }

  isSelectedContract(contract: Contract): boolean {
    return this.selectedContract?.id === contract.id;
  }

  isSelectedSubscription(sub: Subscription): boolean {
    return this.selectedSubscription?.id === sub.id;
  }

  onContractRightClick(event: MouseEvent, contract: Contract) {
  event.preventDefault(); // Standard-Browser-Kontextmenü verhindern
  this.contextMenuVisible = true;
  this.contextMenuPosition = { x: event.clientX, y: event.clientY };
  this.contextMenuContract = contract;
}

// Aktion aus dem Menü
onContractAction(action: 'neu' | 'kündigen' | 'stornieren') {
  if (!this.contextMenuContract) return;

  console.log(`Aktion "${action}" auf Vertrag`, this.contextMenuContract);

  // Beispiel: echte Logik hier
  switch(action) {
    case 'neu':
      // Vertrag neu erstellen
      break;
    case 'kündigen':
      // Vertrag kündigen
      break;
    case 'stornieren':
      // Vertrag stornieren
      break;
  }

  // Menü schließen
  this.contextMenuVisible = false;
}

// Menü schließen bei Klick außerhalb
@HostListener('document:click', ['$event'])
onDocumentClick(event: MouseEvent) {
  if (this.contextMenuVisible) {
    this.contextMenuVisible = false;
  }
}
}
