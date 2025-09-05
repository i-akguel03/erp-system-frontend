import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api-service';
import { Product } from '../models/Product';

@Injectable({
  providedIn: 'root',
})
export class ProductService extends BaseApiService {
  private apiUrl = `${this.apiBaseUrl}/api/products`;

  // --- CRUD ---
  getProducts(paginated: boolean = false, page: number = 0, size: number = 20, sortBy: string = 'name', sortDirection: string = 'ASC'): Observable<Product[]> {
    const params: any = { paginated: paginated.toString(), page: page.toString(), size: size.toString(), sortBy, sortDirection };
    return this.http.get<Product[]>(this.apiUrl, { headers: this.getAuthHeaders(), params });
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  createProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product, { headers: this.getAuthHeaders() });
  }

  updateProduct(id: string, product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product, { headers: this.getAuthHeaders() });
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  // --- Search & Count ---
  searchProducts(query: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/search`, { headers: this.getAuthHeaders(), params: { q: query } });
  }

  getTotalProductCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count`, { headers: this.getAuthHeaders() });
  }

  initTestProducts(): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/init`, {}, { headers: this.getAuthHeaders() });
  }
}
