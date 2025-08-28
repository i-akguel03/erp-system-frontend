import { Component, OnInit } from '@angular/core';
import { Customer, Address, Contract, Subscription } from '../../services/customer-service/customer';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Product, Invoice, ErpService } from '../../services/test-service/testservice';

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

    this.erpService.getAddresses().subscribe(a => this.addresses = a);
    this.erpService.getCustomers().subscribe(c => this.customers = c);
    this.erpService.getProducts().subscribe(p => this.products = p);
    this.erpService.getContracts().subscribe(cn => this.contracts = cn);
    this.erpService.getSubscriptions().subscribe(s => this.subscriptions = s);
    this.erpService.getInvoices().subscribe(i => this.invoices = i);

    this.loading = false;
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
      c.residentialAddress?.street.toLowerCase().includes(term) ||
      c.billingAddress?.street.toLowerCase().includes(term) ||
      c.shippingAddress?.street.toLowerCase().includes(term)
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
      i.customer?.firstName.toLowerCase().includes(term) ||
      i.customer?.lastName.toLowerCase().includes(term)
    );
  }
}
