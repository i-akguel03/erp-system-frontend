import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BaseApiService } from './base-api-service';
import { Contract } from '../models/Contract';


@Injectable({
  providedIn: 'root',
})
export class ContractService extends BaseApiService {
  private apiUrl = `${this.apiBaseUrl}/api/contracts`;

  // --- CRUD ---
  getContractsPaginated(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'startDate',
    sortDirection: string = 'DESC'
  ): Observable<Contract[]> {

    const params = { 
      paginated: 'true', 
      page: page.toString(), 
      size: size.toString(), 
      sortBy: sortBy, 
      sortDirection: sortDirection
    };

    return this.http.get<any>(this.apiUrl, { headers: this.getAuthHeaders(), params })
      .pipe(map(res => res.content as Contract[]));
  } 

  getContracts(
    paginated: boolean = false,
    page: number = 0,
    size: number = 20,
    sortBy: string = 'startDate',
    sortDirection: string = 'DESC'
  ): Observable<Contract[]> {
    const params: any = { paginated: paginated.toString(), page: page.toString(), size: size.toString(), sortBy, sortDirection };
    return this.http.get<Contract[]>(this.apiUrl, { headers: this.getAuthHeaders(), params });
  }

  getAllContracts(): Observable<Contract[]> {
  return this.http.get<Contract[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }


  getContractById(id: string): Observable<Contract> {
    return this.http.get<Contract>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  getContractByNumber(contractNumber: string): Observable<Contract> {
    return this.http.get<Contract>(`${this.apiUrl}/by-number/${contractNumber}`, { headers: this.getAuthHeaders() });
  }

  createContract(contract: Contract): Observable<Contract> {
    return this.http.post<Contract>(this.apiUrl, contract, { headers: this.getAuthHeaders() });
  }

  updateContract(id: string, contract: Contract): Observable<Contract> {
    return this.http.put<Contract>(`${this.apiUrl}/${id}`, contract, { headers: this.getAuthHeaders() });
  }

  deleteContract(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  // --- Status & Filter ---
  getContractsByStatus(status: string): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.apiUrl}/status/${status}`, { headers: this.getAuthHeaders() });
  }

  getContractsByCustomer(customerId: string, activeOnly: boolean = false): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.apiUrl}/customer/${customerId}`, {
      headers: this.getAuthHeaders(),
      params: { activeOnly }
    });
  }

  getActiveContractCountByCustomer(customerId: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/customer/${customerId}/active-count`, { headers: this.getAuthHeaders() });
  }

  getContractsExpiringInDays(days: number = 30): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.apiUrl}/expiring`, { headers: this.getAuthHeaders(), params: { days } });
  }

  getExpiredContracts(): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.apiUrl}/expired`, { headers: this.getAuthHeaders() });
  }

  searchContracts(query: string): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.apiUrl}/search`, { headers: this.getAuthHeaders(), params: { q: query } });
  }

  getContractsWithActiveSubscriptions(): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.apiUrl}/with-active-subscriptions`, { headers: this.getAuthHeaders() });
  }

  getTotalContractCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count`, { headers: this.getAuthHeaders() });
  }

  // --- Lifecycle Actions ---
  activateContract(id: string): Observable<Contract> {
    return this.http.patch<Contract>(`${this.apiUrl}/${id}/activate`, {}, { headers: this.getAuthHeaders() });
  }

  // terminateContract(id: string, terminationDate?: string): Observable<Contract> {
  //   const params = terminationDate ? { terminationDate } : {};
  //   return this.http.patch<Contract>(
  //     `${this.apiUrl}/${id}/terminate`,
  //     null,  // <- null statt {}
  //     { headers: this.getAuthHeaders(), params, responseType: 'json' }
  //   );
  // }
  suspendContract(id: string): Observable<Contract> {
    return this.http.patch<Contract>(`${this.apiUrl}/${id}/suspend`, {}, { headers: this.getAuthHeaders() });
  }
}
