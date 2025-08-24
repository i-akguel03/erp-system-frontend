import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/services/auth';
import { environment } from '../../../environments/environment';

export interface Address {
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface Customer {
  id?: string;
  customerNumber?: string;
  firstName: string;
  lastName: string;
  email: string;
  tel: string;
  residentialAddressId?: string;
  billingAddressId?: string;
  shippingAddressId?: string;

  // komplette Objekte, optional
  residentialAddress?: Address;
  billingAddress?: Address;
  shippingAddress?: Address;
}


@Injectable({
  providedIn: 'root',
})
export class CustomerService {

  private baseUrl = environment.apiBaseUrl;
  //private apiUrl = 'http://localhost:8080/api/customers'; // Backend-URL
  private apiUrl = `${this.baseUrl}/api/customers`; // Backend-URL anpassen


  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();
    
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });
    } else {
      // Falls kein Token vorhanden, nur Content-Type setzen
      return new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });
    }
  }

  // Prüfen ob Token vorhanden ist (über AuthService)
  hasValidToken(): boolean {
    const token = this.authService.getAccessToken();
    if (!token) return false;

    try {
      // JWT Token Payload dekodieren (ohne Signatur-Verifikation)
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Prüfen ob Token abgelaufen ist
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Fehler beim Dekodieren des JWT Tokens:', error);
      return false;
    }
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

