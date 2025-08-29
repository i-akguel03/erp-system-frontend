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
      sortBy, 
      sortDirection
    };
    return this.http.get<Contract[]>(this.apiUrl, { headers: this.getAuthHeaders(), params });
  } 

  getContracts(
    paginated: boolean = false,
    page: number = 0,
    size: number = 20,
    sortBy: string = 'startDate',
    sortDirection: string = 'DESC'
  ): Observable<Contract[]> {
    const params: any = { 
      paginated: paginated.toString(), 
      page: page.toString(), 
      size: size.toString(), 
      sortBy, 
      sortDirection 
    };
    return this.http.get<Contract[]>(this.apiUrl, { headers: this.getAuthHeaders(), params });
  }

  getAllContracts(): Observable<Contract[]> {
    return this.http.get<Contract[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  getContractById(id: string): Observable<Contract> {
    return this.http.get<Contract>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
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

  // --- Status & Lifecycle Actions ---
// --- Status & Lifecycle Actions ---
activateContract(contractId: string): Observable<Contract> {
  const url = `${this.apiUrl}/${contractId}/activate`;
  return this.http.patch<Contract>(url, {}, { headers: this.getAuthHeaders() });
}

suspendContract(contractId: string): Observable<Contract> {
  const url = `${this.apiUrl}/${contractId}/suspend`;
  return this.http.patch<Contract>(url, {}, { headers: this.getAuthHeaders() });
}

terminateContract(contractId: string, terminationDate?: string): Observable<Contract> {
  const url = terminationDate
    ? `${this.apiUrl}/${contractId}/terminate?terminationDate=${terminationDate}`
    : `${this.apiUrl}/${contractId}/terminate`;

  return this.http.patch<Contract>(url, {}, { headers: this.getAuthHeaders() });
}


  // --- Filter & Queries ---
  getContractsByStatus(status: string): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.apiUrl}/status/${status}`, { headers: this.getAuthHeaders() });
  }

  getContractsByCustomer(customerId: string, activeOnly: boolean = false): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.apiUrl}/customer/${customerId}`, {
      headers: this.getAuthHeaders(),
      params: { activeOnly: activeOnly.toString() }
    });
  }

  getActiveContractCountByCustomer(customerId: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/customer/${customerId}/active-count`, { headers: this.getAuthHeaders() });
  }

  getContractsExpiringInDays(days: number = 30): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.apiUrl}/expiring`, { 
      headers: this.getAuthHeaders(), 
      params: { days: days.toString() } 
    });
  }

  getExpiredContracts(): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.apiUrl}/expired`, { headers: this.getAuthHeaders() });
  }

  searchContracts(query: string): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.apiUrl}/search`, { 
      headers: this.getAuthHeaders(), 
      params: { q: query } 
    });
  }

  getContractsWithActiveSubscriptions(): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.apiUrl}/with-active-subscriptions`, { headers: this.getAuthHeaders() });
  }

  getTotalContractCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count`, { headers: this.getAuthHeaders() });
  }
}
