import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/services/auth';
import { environment } from '../../../environments/environment';

export interface Address {
  id?: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface Subscription {
  id?: string;
  subscriptionNumber?: string;
  productName: string;
  monthlyPrice: number;
  startDate: string;
  endDate?: string;
  billingCycle: string;
  subscriptionStatus: string;
  autoRenewal: boolean;
}

export interface Contract {
  id?: string;
  contractNumber?: string;
  contractTitle?: string;
  startDate?: string;
  endDate?: string;
  subscriptions?: Subscription[];
}

export interface Customer {
  id?: string;
  customerNumber?: string;
  firstName: string;
  lastName: string;
  email: string;
  tel: string;

  residentialAddress?: Address;
  billingAddress?: Address;
  shippingAddress?: Address;

  contracts?: Contract[];
}


// --- Service ---
@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private baseUrl = environment.apiBaseUrl;
  private apiUrl = `${this.baseUrl}/api/customers`;

  constructor(private http: HttpClient, private authService: AuthService) {}

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

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  getCustomerById(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  createCustomer(customer: Customer): Observable<Customer> {
    return this.http.post<Customer>(this.apiUrl, customer, { headers: this.getAuthHeaders() });
  }

  updateCustomer(id: string, customer: Customer): Observable<Customer> {
    return this.http.put<Customer>(`${this.apiUrl}/${id}`, customer, { headers: this.getAuthHeaders() });
  }

  deleteCustomer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}