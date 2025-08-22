import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Customer {
  id?: string; // nur für Daten vom Backend
  firstName: string;
  lastName: string;
  email: string;
  tel: string;
  residentialAddressId?: string;
  billingAddressId?: string;
  shippingAddressId?: string;
}


@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private apiUrl = 'https://erp-system-backend-yo8w.onrender.com/api/customers'; // Backend-URL anpassen

  private username = 'erp';  // Basic Auth Benutzername
  private password = 'erp';  // Basic Auth Passwort

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = btoa(`${this.username}:${this.password}`); // Base64 Kodierung
    return new HttpHeaders({
      Authorization: `Basic ${token}`,
    });
  }

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.apiUrl, {
      headers: this.getAuthHeaders(),
    });
  }

  getCustomerById(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  createCustomer(customer: Customer): Observable<Customer> {
    return this.http.post<Customer>(this.apiUrl, customer, {
      headers: this.getAuthHeaders(),
    });
  }

  updateCustomer(id: string, customer: Customer): Observable<Customer> {
    return this.http.put<Customer>(`${this.apiUrl}/${id}`, customer, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteCustomer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }
}
