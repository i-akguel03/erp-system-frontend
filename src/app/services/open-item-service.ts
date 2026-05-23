import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaseApiService } from './base-api-service';
import { OpenItem } from '../models/OpenItem';
import { PagedResult } from '../models/PagedResult';

@Injectable({
  providedIn: 'root',
})
export class OpenItemService extends BaseApiService {
  private apiUrl = `${this.apiBaseUrl}/api/openitems`;

  // --- Mapper ---
  private mapToOpenItem(dto: any): OpenItem {
    return {
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      paidDate: dto.paidDate ? new Date(dto.paidDate) : null,
      createdDate: dto.createdDate ? new Date(dto.createdDate) : null,
      updatedDate: dto.updatedDate ? new Date(dto.updatedDate) : null,
      lastReminderDate: dto.lastReminderDate ? new Date(dto.lastReminderDate) : null,
    } as OpenItem;
  }

  // --- CRUD ---
  getOpenItemsPaginated(page = 0, size = 20): Observable<PagedResult<OpenItem>> {
    const params = { page: page.toString(), size: size.toString() };
    return this.http.get<any[]>(this.apiUrl, { headers: this.getAuthHeaders(), params, observe: 'response' }).pipe(
      map(res => ({
        content: (res.body ?? []).map((dto: any) => this.mapToOpenItem(dto)),
        totalElements: Number(res.headers.get('X-Total-Count') ?? 0),
        totalPages: Number(res.headers.get('X-Total-Pages') ?? 1),
        currentPage: Number(res.headers.get('X-Current-Page') ?? 0)
      }))
    );
  }

  getAllOpenItems(): Observable<OpenItem[]> {
    return this.http.get<any>(this.apiUrl, { headers: this.getAuthHeaders() })
      .pipe(
        map(res => {
          const openItems = (res.content || res);
          return openItems.map((dto: any) => this.mapToOpenItem(dto));
        })
      );
  }

  getOpenItemById(id: string): Observable<OpenItem> {
    return this.http.get<OpenItem>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToOpenItem(dto)));
  }

  createOpenItem(openItem: OpenItem): Observable<OpenItem> {
    return this.http.post<OpenItem>(this.apiUrl, openItem, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToOpenItem(dto)));
  }

  updateOpenItem(id: string, openItem: OpenItem): Observable<OpenItem> {
    return this.http.put<OpenItem>(`${this.apiUrl}/${id}`, openItem, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToOpenItem(dto)));
  }

  deleteOpenItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  // --- Zahlungslogik (Kern-Feature) ---
  recordPayment(openItemId: string, amount: number, paymentMethod?: string, paymentReference?: string): Observable<OpenItem> {
    const params = new URLSearchParams();
    params.append('amount', amount.toString());
    if (paymentMethod) params.append('paymentMethod', paymentMethod);
    if (paymentReference) params.append('paymentReference', paymentReference);

    return this.http.post<OpenItem>(`${this.apiUrl}/${openItemId}/payments?${params.toString()}`, {}, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToOpenItem(dto)));
  }

  reversePayment(openItemId: string, amount: number): Observable<OpenItem> {
    const params = new URLSearchParams();
    params.append('amount', amount.toString());

    return this.http.delete<OpenItem>(`${this.apiUrl}/${openItemId}/payments?${params.toString()}`, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToOpenItem(dto)));
  }

  cancelOpenItem(openItemId: string): Observable<OpenItem> {
    return this.http.patch<OpenItem>(`${this.apiUrl}/${openItemId}/cancel`, {}, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToOpenItem(dto)));
  }

  // --- Status Management ---
  updateOverdueStatus(): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/update-overdue`, {}, { headers: this.getAuthHeaders() });
  }

  getOverdueItems(): Observable<OpenItem[]> {
    return this.http.get<OpenItem[]>(`${this.apiUrl}/overdue`, { headers: this.getAuthHeaders() })
      .pipe(map(items => items.map(dto => this.mapToOpenItem(dto))));
  }

  getItemsDueByDate(dueDate: Date): Observable<OpenItem[]> {
    const dateStr = dueDate.toISOString().split('T')[0];
    return this.http.get<OpenItem[]>(`${this.apiUrl}/due-by-date?dueDate=${dateStr}`, { headers: this.getAuthHeaders() })
      .pipe(map(items => items.map(dto => this.mapToOpenItem(dto))));
  }

  // --- Abfragen nach verschiedenen Kriterien ---
  getOpenItemsByCustomer(customerId: string): Observable<OpenItem[]> {
    return this.http.get<OpenItem[]>(`${this.apiUrl}/customer/${customerId}`, { headers: this.getAuthHeaders() })
      .pipe(map(items => items.map(dto => this.mapToOpenItem(dto))));
  }

  getOpenOpenItemsByCustomer(customerId: string): Observable<OpenItem[]> {
    return this.http.get<OpenItem[]>(`${this.apiUrl}/customer/${customerId}/open`, { headers: this.getAuthHeaders() })
      .pipe(map(items => items.map(dto => this.mapToOpenItem(dto))));
  }

  getOpenItemsByInvoice(invoiceId: string): Observable<OpenItem[]> {
    return this.http.get<OpenItem[]>(`${this.apiUrl}/invoice/${invoiceId}`, { headers: this.getAuthHeaders() })
      .pipe(map(items => items.map(dto => this.mapToOpenItem(dto))));
  }

  getOpenItemsBySubscription(subscriptionId: string): Observable<OpenItem[]> {
    return this.http.get<OpenItem[]>(`${this.apiUrl}/subscription/${subscriptionId}`, { headers: this.getAuthHeaders() })
      .pipe(map(items => items.map(dto => this.mapToOpenItem(dto))));
  }

  getOpenItemsBySubscriptions(subscriptionIds: string[]): Observable<OpenItem[]> {
    const params = subscriptionIds.map(id => `subscriptionIds=${id}`).join('&');
    return this.http.get<OpenItem[]>(`${this.apiUrl}/by-subscriptions?${params}`, { headers: this.getAuthHeaders() })
      .pipe(map(items => items.map(dto => this.mapToOpenItem(dto))));
  }

  getOpenItemsByInvoices(invoiceIds: string[]): Observable<OpenItem[]> {
    const params = invoiceIds.map(id => `invoiceIds=${id}`).join('&');
    return this.http.get<OpenItem[]>(`${this.apiUrl}/by-invoices?${params}`, { headers: this.getAuthHeaders() })
      .pipe(map(items => items.map(dto => this.mapToOpenItem(dto))));
  }

  getOpenItemsByStatus(status: string): Observable<OpenItem[]> {
    return this.http.get<OpenItem[]>(`${this.apiUrl}/status/${status}`, { headers: this.getAuthHeaders() })
      .pipe(map(items => items.map(dto => this.mapToOpenItem(dto))));
  }

  getOpenItemsByDateRange(startDate: Date, endDate: Date): Observable<OpenItem[]> {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    return this.http.get<OpenItem[]>(`${this.apiUrl}/date-range?start=${start}&end=${end}`, { headers: this.getAuthHeaders() })
      .pipe(map(items => items.map(dto => this.mapToOpenItem(dto))));
  }

  getItemsPaidBetween(startDate: Date, endDate: Date): Observable<OpenItem[]> {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    return this.http.get<OpenItem[]>(`${this.apiUrl}/paid-between?start=${start}&end=${end}`, { headers: this.getAuthHeaders() })
      .pipe(map(items => items.map(dto => this.mapToOpenItem(dto))));
  }

  // --- Mahnung-Management ---
  addReminder(openItemId: string): Observable<OpenItem> {
    return this.http.post<OpenItem>(`${this.apiUrl}/${openItemId}/reminders`, {}, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToOpenItem(dto)));
  }

  getItemsNeedingReminder(daysSinceLastReminder: number = 30): Observable<OpenItem[]> {
    return this.http.get<OpenItem[]>(`${this.apiUrl}/reminders/needed?daysSinceLastReminder=${daysSinceLastReminder}`, { headers: this.getAuthHeaders() })
      .pipe(map(items => items.map(dto => this.mapToOpenItem(dto))));
  }

  getItemsWithMultipleReminders(minimumReminderCount: number = 2): Observable<OpenItem[]> {
    return this.http.get<OpenItem[]>(`${this.apiUrl}/reminders/multiple?minimumReminderCount=${minimumReminderCount}`, { headers: this.getAuthHeaders() })
      .pipe(map(items => items.map(dto => this.mapToOpenItem(dto))));
  }

  // --- Statistiken ---
  getTotalOutstandingAmount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/statistics/outstanding-amount`, { headers: this.getAuthHeaders() });
  }

  getTotalPaidAmount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/statistics/paid-amount`, { headers: this.getAuthHeaders() });
  }

  getOutstandingAmountByCustomer(customerId: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/statistics/customer/${customerId}/outstanding`, { headers: this.getAuthHeaders() });
  }

  getOpenItemCountByStatus(status: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/statistics/count/${status}`, { headers: this.getAuthHeaders() });
  }

  getAverageAmountByStatus(status: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/statistics/average/${status}`, { headers: this.getAuthHeaders() });
  }

  getOverdueItemCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/statistics/overdue-count`, { headers: this.getAuthHeaders() });
  }

  // --- Bulk-Operationen ---
  createOpenItemsForInvoices(invoiceIds: string[]): Observable<OpenItem[]> {
    return this.http.post<OpenItem[]>(`${this.apiUrl}/bulk/create-for-invoices`, invoiceIds, { headers: this.getAuthHeaders() })
      .pipe(map(items => items.map(dto => this.mapToOpenItem(dto))));
  }
}