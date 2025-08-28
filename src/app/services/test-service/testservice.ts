import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Customer, Address, Contract, Subscription } from '../customer-service/customer';

export interface Product {
  id: string;
  productNumber: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
  product?: Product;
}

export interface Invoice {
  status?: string;
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  customer: Customer;
  billingAddress: Address;
  invoiceItems: InvoiceItem[];
}

@Injectable({
  providedIn: 'root'
})
export class ErpService {
  private baseUrl = environment.apiBaseUrl + '/api';

  constructor(private http: HttpClient) {}

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${this.baseUrl}/customers`);
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/products`);
  }

  getContracts(): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.baseUrl}/contracts`);
  }

  getSubscriptions(): Observable<Subscription[]> {
    return this.http.get<Subscription[]>(`${this.baseUrl}/subscriptions`);
  }

  getInvoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.baseUrl}/invoices`);
  }

  getAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(`${this.baseUrl}/addresses`);
  }
}
