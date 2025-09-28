import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api-service';
import {
  InvoiceBatchResult,
  InvoiceBatchPreview,
  CanRunResult
} from '../models/InvoiceBatch';

@Injectable({
  providedIn: 'root',
})
export class InvoiceBatchService extends BaseApiService {
  private apiUrl = `${this.apiBaseUrl}/api/invoices/batch`;

  /**
   * ➤ Rechnungslauf für ein bestimmtes Datum starten
   * @param billingDate   LocalDate im Format yyyy-MM-dd
   * @param exactDateOnly true → nur exakt dieses Datum, false → alle offenen Monate bis Datum
   */
  runBatch(
    billingDate: string,
    exactDateOnly: boolean = false
  ): Observable<InvoiceBatchResult> {
    const params = {
      billingDate,
      exactDateOnly: exactDateOnly.toString()
    };
    return this.http.post<InvoiceBatchResult>(
      `${this.apiUrl}/run`,
      {}, // Body ist leer, da alles über Params kommt
      { headers: this.getAuthHeaders(), params }
    );
  }

  /**
   * ➤ Rechnungslauf für HEUTE starten
   */
  runBatchToday(exactDateOnly: boolean = false): Observable<InvoiceBatchResult> {
    const params = { exactDateOnly: exactDateOnly.toString() };
    return this.http.post<InvoiceBatchResult>(
      `${this.apiUrl}/run-today`,
      {},
      { headers: this.getAuthHeaders(), params }
    );
  }

  /**
   * ➤ Vorschau für ein bestimmtes Datum
   */
  getPreview(
    billingDate: string,
    exactDateOnly: boolean = false
  ): Observable<InvoiceBatchPreview> {
    const params = {
      billingDate,
      exactDateOnly: exactDateOnly.toString()
    };
    return this.http.get<InvoiceBatchPreview>(
      `${this.apiUrl}/preview`,
      { headers: this.getAuthHeaders(), params }
    );
  }

  /**
   * ➤ Prüfen, ob ein Rechnungslauf möglich ist
   */
  canRun(
    billingDate: string,
    exactDateOnly: boolean = false
  ): Observable<CanRunResult> {
    const params = {
      billingDate,
      exactDateOnly: exactDateOnly.toString()
    };
    return this.http.get<CanRunResult>(
      `${this.apiUrl}/can-run`,
      { headers: this.getAuthHeaders(), params }
    );
  }
}
