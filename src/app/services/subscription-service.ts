import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaseApiService } from './base-api-service';
import { Subscription, SubscriptionStatus, BillingCycle } from '../models/Subscription';
import { PagedResult } from '../models/PagedResult';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService extends BaseApiService {
  private apiUrl = `${this.apiBaseUrl}/api/subscriptions`;

  // --- Mapper ---
  private mapToSubscription(dto: any): Subscription {
    return {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      monthlyPrice: dto.monthlyPrice != null ? Number(dto.monthlyPrice) : 0,
      productName: dto.productName // optional vom Backend
    } as Subscription;
  }

  // --- CRUD ---
  getSubscriptionsPaginated(page = 0, size = 20): Observable<PagedResult<Subscription>> {
    const params = { paginated: 'true', page: page.toString(), size: size.toString() };
    return this.http.get<any[]>(this.apiUrl, { headers: this.getAuthHeaders(), params, observe: 'response' }).pipe(
      map(res => ({
        content: (res.body ?? []).map((dto: any) => this.mapToSubscription(dto)),
        totalElements: Number(res.headers.get('X-Total-Count') ?? 0),
        totalPages: Number(res.headers.get('X-Total-Pages') ?? 1),
        currentPage: Number(res.headers.get('X-Current-Page') ?? 0)
      }))
    );
  }

  getSubscriptions(
    paginated: boolean = false,
    page: number = 0,
    size: number = 20,
    sortBy: string = 'startDate',
    sortDirection: string = 'DESC'
  ): Observable<Subscription[]> {
    const params: any = { 
      paginated: paginated.toString(), 
      page: page.toString(), 
      size: size.toString(), 
      sortBy, 
      sortDirection 
    };
    return this.http.get<Subscription[]>(this.apiUrl, { headers: this.getAuthHeaders(), params })
      .pipe(map(arr => arr.map(dto => this.mapToSubscription(dto))));
  }

  getAllSubscriptions(): Observable<Subscription[]> {
    return this.http.get<Subscription[]>(this.apiUrl, { headers: this.getAuthHeaders() })
      .pipe(map(arr => arr.map(dto => this.mapToSubscription(dto))));
  }

  getSubscriptionById(id: string): Observable<Subscription> {
    return this.http.get<Subscription>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToSubscription(dto)));
  }

  getSubscriptionByNumber(subscriptionNumber: string): Observable<Subscription> {
    return this.http.get<Subscription>(`${this.apiUrl}/by-number/${subscriptionNumber}`, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToSubscription(dto)));
  }

  createSubscription(subscription: Subscription): Observable<Subscription> {
    if (!subscription.productId) {
      throw new Error('productId is required to create a subscription');
    }
    if (!subscription.contractId) {
      throw new Error('contractId is required to create a subscription');
    }

    const payload = {
      ...subscription,
      startDate: subscription.startDate?.toISOString(),
      endDate: subscription.endDate?.toISOString()
    };

    return this.http.post<Subscription>(this.apiUrl, payload, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToSubscription(dto)));
  }

  updateSubscription(id: string, subscription: Subscription): Observable<Subscription> {
    if (!subscription.productId) {
      throw new Error('productId is required to update a subscription');
    }

    const payload = {
      ...subscription,
      startDate: subscription.startDate?.toISOString(),
      endDate: subscription.endDate?.toISOString()
    };

    return this.http.put<Subscription>(`${this.apiUrl}/${id}`, payload, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToSubscription(dto)));
  }

  deleteSubscription(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  // --- Status & Lifecycle Actions ---
  activateSubscription(id: string): Observable<Subscription> {
    return this.http.patch<Subscription>(`${this.apiUrl}/${id}/activate`, {}, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToSubscription(dto)));
  }

  cancelSubscription(id: string, cancellationDate?: string): Observable<Subscription> {
    const url = cancellationDate 
      ? `${this.apiUrl}/${id}/cancel?cancellationDate=${cancellationDate}`
      : `${this.apiUrl}/${id}/cancel`;
    return this.http.patch<Subscription>(url, {}, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToSubscription(dto)));
  }

  pauseSubscription(id: string): Observable<Subscription> {
    return this.http.patch<Subscription>(`${this.apiUrl}/${id}/pause`, {}, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToSubscription(dto)));
  }

  renewSubscription(id: string, newEndDate: string): Observable<Subscription> {
    const url = `${this.apiUrl}/${id}/renew?newEndDate=${newEndDate}`;
    return this.http.patch<Subscription>(url, {}, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToSubscription(dto)));
  }

  // --- Queries & Filters ---
  getSubscriptionsByContract(contractId: string, activeOnly: boolean = false): Observable<Subscription[]> {
    return this.http.get<Subscription[]>(`${this.apiUrl}/contract/${contractId}`, {
      headers: this.getAuthHeaders(),
      params: { activeOnly: activeOnly.toString() }
    }).pipe(map(arr => arr.map(dto => this.mapToSubscription(dto))));
  }

  getSubscriptionsByCustomer(customerId: string, activeOnly: boolean = false): Observable<Subscription[]> {
    return this.http.get<Subscription[]>(`${this.apiUrl}/customer/${customerId}`, {
      headers: this.getAuthHeaders(),
      params: { activeOnly: activeOnly.toString() }
    }).pipe(map(arr => arr.map(dto => this.mapToSubscription(dto))));
  }

  getSubscriptionsByStatus(status: string): Observable<Subscription[]> {
    return this.http.get<Subscription[]>(`${this.apiUrl}/status/${status}`, { headers: this.getAuthHeaders() })
      .pipe(map(arr => arr.map(dto => this.mapToSubscription(dto))));
  }

  getSubscriptionsExpiringInDays(days: number = 30): Observable<Subscription[]> {
    return this.http.get<Subscription[]>(`${this.apiUrl}/expiring`, { 
      headers: this.getAuthHeaders(), 
      params: { days: days.toString() }
    }).pipe(map(arr => arr.map(dto => this.mapToSubscription(dto))));
  }

  getSubscriptionsForAutoRenewal(days: number = 7): Observable<Subscription[]> {
    return this.http.get<Subscription[]>(`${this.apiUrl}/auto-renewal`, { 
      headers: this.getAuthHeaders(), 
      params: { days: days.toString() }
    }).pipe(map(arr => arr.map(dto => this.mapToSubscription(dto))));
  }

  searchSubscriptions(query: string): Observable<Subscription[]> {
    return this.http.get<Subscription[]>(`${this.apiUrl}/search`, { 
      headers: this.getAuthHeaders(), 
      params: { q: query }
    }).pipe(map(arr => arr.map(dto => this.mapToSubscription(dto))));
  }

  // --- Analytics & KPIs ---
  getTotalActiveRevenue(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/revenue/total`, { headers: this.getAuthHeaders() });
  }

  getActiveRevenueByCustomer(customerId: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/revenue/customer/${customerId}`, { headers: this.getAuthHeaders() });
  }

  getTopProductsByActiveSubscriptions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/analytics/top-products`, { headers: this.getAuthHeaders() });
  }

  getTopSubscriptionsByPrice(limit: number = 10): Observable<Subscription[]> {
    return this.http.get<Subscription[]>(`${this.apiUrl}/analytics/top-subscriptions`, { 
      headers: this.getAuthHeaders(), 
      params: { limit: limit.toString() }
    }).pipe(map(arr => arr.map(dto => this.mapToSubscription(dto))));
  }

  getTotalSubscriptionCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count`, { headers: this.getAuthHeaders() });
  }

  getSubscriptionCountByStatus(status: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count/by-status/${status}`, { headers: this.getAuthHeaders() });
  }

  getDashboardData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard`, { headers: this.getAuthHeaders() });
  }

  // --- Processes ---
  processAutoRenewals(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/process/auto-renewals`, {}, { headers: this.getAuthHeaders() });
  }

  processExpiredSubscriptions(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/process/expired`, {}, { headers: this.getAuthHeaders() });
  }

  initTestSubscriptions(): Observable<string> {
    return this.http.post(`${this.apiUrl}/init`, {}, { 
      headers: this.getAuthHeaders(), 
      responseType: 'text' 
    });
  }
}
