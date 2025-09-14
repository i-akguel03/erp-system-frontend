import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BaseApiService } from './base-api-service';
import { Invoice, InvoiceItem } from '../models/Invoice';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService extends BaseApiService {
  private apiUrl = `${this.apiBaseUrl}/api/invoices`;

  // --- Mapper - KORRIGIERT ---
  private mapToInvoice(dto: any): Invoice {
    return {
      ...dto,
      invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : null,
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : null,
      // KRITISCHER FIX: Backend sendet "items", Frontend erwartet "invoiceItems"
      invoiceItems: (dto.items || dto.invoiceItems || []).map((item: any) => ({
        ...item,
        periodStart: item.periodStart ? new Date(item.periodStart) : null,
        periodEnd: item.periodEnd ? new Date(item.periodEnd) : null,
      })),
    } as Invoice;
  }

  // --- CRUD ---
  getAllInvoices(): Observable<Invoice[]> {
    return this.http.get<any>(this.apiUrl, { headers: this.getAuthHeaders() })
      .pipe(
        map(res => {
          const invoices = (res.content || res);
          console.log('Backend Response:', invoices); // Debug-Log
          const mappedInvoices = invoices.map((dto: any) => {
            const mapped = this.mapToInvoice(dto);
            console.log(`Rechnung ${mapped.invoiceNumber}: ${mapped.invoiceItems?.length || 0} Items`); // Debug-Log
            return mapped;
          });
          return mappedInvoices;
        })
      );
  }

  getInvoiceById(id: string): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        map(dto => {
          const mapped = this.mapToInvoice(dto);
          console.log(`Einzelne Rechnung ${mapped.invoiceNumber}: ${mapped.invoiceItems?.length || 0} Items`); // Debug-Log
          return mapped;
        })
      );
  }

  createInvoice(invoice: Invoice): Observable<Invoice> {
    return this.http.post<Invoice>(this.apiUrl, invoice, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToInvoice(dto)));
  }

  updateInvoice(id: string, invoice: Invoice): Observable<Invoice> {
    return this.http.put<Invoice>(`${this.apiUrl}/${id}`, invoice, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToInvoice(dto)));
  }

  deleteInvoice(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  // --- InvoiceItem Management ---
  addInvoiceItem(invoiceId: string, item: InvoiceItem): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.apiUrl}/${invoiceId}/items`, item, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToInvoice(dto)));
  }

  removeInvoiceItem(invoiceId: string, itemId: string): Observable<Invoice> {
    return this.http.delete<Invoice>(`${this.apiUrl}/${invoiceId}/items/${itemId}`, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToInvoice(dto)));
  }

  // --- Status Management ---
  changeStatus(invoiceId: string, status: 'DRAFT' | 'SENT' | 'CANCELLED'): Observable<Invoice> {
    return this.http.patch<Invoice>(`${this.apiUrl}/${invoiceId}/status`, { status }, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToInvoice(dto)));
  }

  sendInvoice(invoiceId: string): Observable<Invoice> {
    return this.http.patch<Invoice>(`${this.apiUrl}/${invoiceId}/send`, {}, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToInvoice(dto)));
  }

  cancelInvoice(invoiceId: string): Observable<Invoice> {
    return this.http.patch<Invoice>(`${this.apiUrl}/${invoiceId}/cancel`, {}, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToInvoice(dto)));
  }

  // --- OpenItems & Credit Notes ---
  getOpenItems(invoiceId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${invoiceId}/open-items`, { headers: this.getAuthHeaders() });
  }

  createCreditNote(invoiceId: string): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.apiUrl}/${invoiceId}/credit-note`, {}, { headers: this.getAuthHeaders() })
      .pipe(map(dto => this.mapToInvoice(dto)));
  }
}