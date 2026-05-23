import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from './base-api-service';
import { Address } from '../models/Address';
import { PagedResult } from '../models/PagedResult';

@Injectable({
  providedIn: 'root',
})
export class AddressService extends BaseApiService {
  private apiUrl = `${this.apiBaseUrl}/api/addresses`;

  // --- CRUD ---
  getAddressesPagedResult(page = 0, size = 20): Observable<PagedResult<Address>> {
    const params = { paginated: 'true', page: page.toString(), size: size.toString() };
    return this.http.get<Address[]>(this.apiUrl, { headers: this.getAuthHeaders(), params, observe: 'response' }).pipe(
      map(res => ({
        content: res.body ?? [],
        totalElements: Number(res.headers.get('X-Total-Count') ?? 0),
        totalPages: Number(res.headers.get('X-Total-Pages') ?? 1),
        currentPage: Number(res.headers.get('X-Current-Page') ?? 0)
      }))
    );
  }

  getAddressesPaginated(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'street',
    sortDirection: string = 'ASC'
  ): Observable<Address[]> {
    const params = {
      paginated: 'true',
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDirection
    };
    return this.http.get<Address[]>(this.apiUrl, { headers: this.getAuthHeaders(), params });
  }

  getAddresses(
    paginated: boolean = false,
    page: number = 0,
    size: number = 20,
    sortBy: string = 'street',
    sortDirection: string = 'ASC'
  ): Observable<Address[]> {
    const params: any = {
      paginated: paginated.toString(),
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDirection
    };
    return this.http.get<Address[]>(this.apiUrl, { headers: this.getAuthHeaders(), params });
  }

  getAllAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  getAddressById(id: number): Observable<Address> {
    return this.http.get<Address>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  createAddress(address: Address): Observable<Address> {
    return this.http.post<Address>(this.apiUrl, address, { headers: this.getAuthHeaders() });
  }

  updateAddress(id: number, address: Address): Observable<Address> {
    return this.http.put<Address>(
      `${this.apiUrl}/${id}`,
      address,
      { headers: this.getAuthHeaders() }
    );
  }


  deleteAddress(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  // --- Filter & Queries ---
  searchAddresses(query: string): Observable<Address[]> {
    return this.http.get<Address[]>(`${this.apiUrl}/search`, { 
      headers: this.getAuthHeaders(),
      params: { q: query }
    });
  }

  getAddressesByCity(city: string): Observable<Address[]> {
    return this.http.get<Address[]>(`${this.apiUrl}/city/${city}`, { headers: this.getAuthHeaders() });
  }

  getAddressesByPostalCode(postalCode: string): Observable<Address[]> {
    return this.http.get<Address[]>(`${this.apiUrl}/postal-code/${postalCode}`, { headers: this.getAuthHeaders() });
  }

  getTotalAddressCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count`, { headers: this.getAuthHeaders() });
  }
}
