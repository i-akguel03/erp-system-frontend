import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { forkJoin, Subscription } from 'rxjs';

import { Invoice, InvoiceItem, ErpService } from '../../services/testservice';
import { Address } from '../../models/Address';
import { Contract } from '../../models/Contract';
import { Customer } from '../../models/Customer';
import { Product } from '../../models/Product';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './test-dashboard.html',
  styleUrls: ['./test-dashboard.scss']
})
export class TestDashboardComponent implements OnInit {
  customers: Customer[] = [];
  products: Product[] = [];
  contracts: Contract[] = [];
  subscriptions: Subscription[] = [];
  invoices: Invoice[] = [];
  addresses: Address[] = [];

  loading = true;

  selectedCustomer: Customer | null = null;
  selectedContract: Contract | null = null;
  selectedSubscription: Subscription | null = null;
  selectedInvoice: Invoice | null = null;

  customerSearch = '';
  productSearch = '';
  invoiceSearch = '';

  constructor(private erpService: ErpService) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loading = true;

    forkJoin({
      addresses: this.erpService.getAddresses(),
      customers: this.erpService.getCustomers(),
      products: this.erpService.getProducts(),
      contracts: this.erpService.getContracts(),
      subscriptions: this.erpService.getSubscriptions(),
      invoices: this.erpService.getInvoices()
    }).subscribe({
      next: ({ addresses, customers, products, contracts, subscriptions, invoices }) => {
        this.addresses = addresses;
        this.products = products;

        // --- Kunden: Adressen zuordnen ---
        // this.customers = customers.map(c => {
        //   const billingAddress = addresses.find(a => a.id === c.billingAddress?.id) || undefined;
        //   const shippingAddress = addresses.find(a => a.id === c.shippingAddress?.id) || undefined;
        //   const residentialAddress = addresses.find(a => a.id === c.residentialAddress?.id) || undefined;

        //   // Verträge + Subscriptions zuordnen
        //   const customerContracts: Contract[] = contracts
        //     .filter(ct => ct.customerId === c.id)
        //     .map(ct => {
        //       const mappedSubs: Subscription[] = subscriptions
        //         .filter(s => s.contractId === ct.id)
        //         .map(s => ({
        //           id: s.id,
        //           subscriptionNumber: s.subscriptionNumber,
        //           productName: s.productName,
        //           monthlyPrice: Number(s.monthlyPrice),
        //           billingCycle: s.billingCycle,
        //           subscriptionStatus: s.subscriptionStatus,
        //           contractId: s.contractId,
        //           autoRenewal: s.autoRenewal,
        //           startDate: s.startDate,
        //           endDate: s.endDate
        //         }));

        //       return {
        //         id: ct.id,
        //         contractNumber: ct.contractNumber,
        //         customerId: ct.customerId,
        //         startDate: ct.startDate,
        //         endDate: ct.endDate,
        //         subscriptions: mappedSubs
        //       };
        //     });

        //   return {
        //     ...c,
        //     billingAddress,
        //     shippingAddress,
        //     residentialAddress,
        //     contracts: customerContracts
        //   };
        // });

        // --- Rechnungen: Strings für Datum + Zahlen konvertieren + Zuordnung ---
        this.invoices = invoices.map(inv => ({
          ...inv,
          invoiceDate: inv.invoiceDate,
          dueDate: inv.dueDate,
          subtotal: Number(inv.subtotal),
          taxAmount: Number(inv.taxAmount),
          totalAmount: Number(inv.totalAmount),
          customer: this.customers.find(c => c.id === inv.customer?.id) || inv.customer,
          billingAddress: addresses.find(a => a.id === inv.billingAddress?.id) || inv.billingAddress,
          invoiceItems: inv.invoiceItems?.map((item: InvoiceItem) => ({
            id: item.id,
            description: item.description,
            quantity: Number(item.quantity),
            unit: item.unit,
            unitPrice: Number(item.unitPrice),
            lineTotal: Number(item.lineTotal),
            product: item.product?.id ? products.find(p => p.id === item.product?.id) : undefined,
            position: item.position,
            taxRate: Number(item.taxRate)
          })) || []
        }));

        this.loading = false;
      },
      error: err => {
        console.error('Fehler beim Laden der Daten', err);
        this.loading = false;
      }
    });
  }

  openCustomerModal(c: Customer) { this.selectedCustomer = c; }
  openContractModal(c: Contract) { this.selectedContract = c; }
  openSubscriptionModal(s: Subscription) { this.selectedSubscription = s; }
  openInvoiceModal(i: Invoice) { this.selectedInvoice = i; }

  closeModals() {
    this.selectedCustomer = null;
    this.selectedContract = null;
    this.selectedSubscription = null;
    this.selectedInvoice = null;
  }

  get filteredCustomers() {
    const term = this.customerSearch.toLowerCase();
    return this.customers.filter(c =>
      c.firstName.toLowerCase().includes(term) ||
      c.lastName.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.residentialAddress?.street?.toLowerCase().includes(term) ||
      c.billingAddress?.street?.toLowerCase().includes(term) ||
      c.shippingAddress?.street?.toLowerCase().includes(term)
    );
  }

  get filteredProducts() {
    const term = this.productSearch.toLowerCase();
    return this.products.filter(p => p.name.toLowerCase().includes(term));
  }

  get filteredInvoices() {
    const term = this.invoiceSearch.toLowerCase();
    return this.invoices.filter(i =>
      i.invoiceNumber.toLowerCase().includes(term) ||
      i.customer?.firstName?.toLowerCase().includes(term) ||
      i.customer?.lastName?.toLowerCase().includes(term)
    );
  }
}
