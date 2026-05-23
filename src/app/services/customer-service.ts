import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BaseApiService } from './base-api-service';
import { Customer } from '../models/Customer';
import { PagedResult } from '../models/PagedResult';

@Injectable({
  providedIn: 'root',
})
export class CustomerService extends BaseApiService {
  private apiUrl = `${this.apiBaseUrl}/api/customers`;

  getCustomersPaginated(page = 0, size = 20): Observable<PagedResult<Customer>> {
    const params = { paginated: 'true', page: page.toString(), size: size.toString() };
    return this.http.get<Customer[]>(this.apiUrl, { headers: this.getAuthHeaders(), params, observe: 'response' }).pipe(
      map(res => ({
        content: res.body ?? [],
        totalElements: Number(res.headers.get('X-Total-Count') ?? 0),
        totalPages: Number(res.headers.get('X-Total-Pages') ?? 1),
        currentPage: Number(res.headers.get('X-Current-Page') ?? 0)
      }))
    );
  }

  getCustomers(): Observable<Customer[]> {
    return this.http.get(this.apiUrl, { headers: this.getAuthHeaders(), responseType: 'text' }).pipe(
      map(text => JSON.parse(text) as Customer[]),
      catchError(err => {
        if (err instanceof SyntaxError) {
          return throwError(() => ({
            status: 200,
            error: { message: 'Die Kundendaten vom Server sind fehlerhaft (ungültiges Format). Bitte wenden Sie sich an den Administrator.' }
          }));
        }
        return throwError(() => err);
      })
    );
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
