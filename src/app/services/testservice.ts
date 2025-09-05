import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/services/auth';
import { Address } from '../models/Address';
import { Contract } from '../models/Contract';
import { Customer } from '../models/Customer';
import { Product } from '../models/Product';


export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
  product?: Product;
  position?: number;
  taxRate?: number;
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

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();
    return token
      ? new HttpHeaders({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        })
      : new HttpHeaders({
          'Content-Type': 'application/json',
          Accept: 'application/json',
        });
  }

initTestDB(): Observable<string> {
  return this.http.post<string>(
    `${this.baseUrl}/init`,
    {}, // kein Body notwendig
    { headers: this.getAuthHeaders() }
  );}

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${this.baseUrl}/customers`, { headers: this.getAuthHeaders() });
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/products`, { headers: this.getAuthHeaders() });
  }

  getContracts(): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.baseUrl}/contracts`, { headers: this.getAuthHeaders() });
  }

  getSubscriptions(): Observable<Subscription[]> {
    return this.http.get<Subscription[]>(`${this.baseUrl}/subscriptions`, { headers: this.getAuthHeaders() });
  }

  getInvoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.baseUrl}/invoices`, { headers: this.getAuthHeaders() });
  }

  getAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(`${this.baseUrl}/addresses`, { headers: this.getAuthHeaders() });
  }
}
