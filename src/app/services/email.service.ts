import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/services/auth';
import { BaseApiService } from './base-api-service';

@Injectable({ providedIn: 'root' })
export class EmailService extends BaseApiService {
  private base = this.apiBaseUrl;

  constructor(http: HttpClient, authService: AuthService) {
    super(http, authService);
  }

  sendWelcomeEmail(customerId: string): Observable<void> {
    return this.http.post<void>(
      `${this.base}/api/customers/${customerId}/send-welcome`, {},
      { headers: this.getAuthHeaders() }
    );
  }

  sendInvoiceEmail(invoiceId: string): Observable<void> {
    return this.http.post<void>(
      `${this.base}/api/invoices/${invoiceId}/send-email`, {},
      { headers: this.getAuthHeaders() }
    );
  }

  sendPaymentReminder(openItemId: string): Observable<void> {
    return this.http.post<void>(
      `${this.base}/api/open-items/${openItemId}/send-reminder`, {},
      { headers: this.getAuthHeaders() }
    );
  }

  sendContractExpiryNotice(contractId: string): Observable<void> {
    return this.http.post<void>(
      `${this.base}/api/contracts/${contractId}/send-expiry-notice`, {},
      { headers: this.getAuthHeaders() }
    );
  }

  sendSubscriptionExpiryNotice(subscriptionId: string): Observable<void> {
    return this.http.post<void>(
      `${this.base}/api/subscriptions/${subscriptionId}/send-expiry-notice`, {},
      { headers: this.getAuthHeaders() }
    );
  }
}
