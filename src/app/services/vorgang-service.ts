import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api-service';
import { HttpParams } from '@angular/common/http';
import { VorgangDTO, VorgangStatistik, VorgangTyp, VorgangStatus } from '../models/Vorgang';

// Interface für paginierte Antworten
export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class VorgangService extends BaseApiService {
  private apiUrl = `${this.apiBaseUrl}/api/vorgaenge`;

  /**
   * Alle Vorgänge paginiert
   */
  getAllVorgaenge(page: number = 0, size: number = 20, sort: string = 'startZeitpunkt,desc'): Observable<PageResponse<VorgangDTO>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);
    return this.http.get<PageResponse<VorgangDTO>>(this.apiUrl, { headers: this.getAuthHeaders(), params });
  }

  /**
   * Alle Vorgänge (ohne Paging)
   */
  getAllVorgaengeOhnePaging(): Observable<VorgangDTO[]> {
    return this.http.get<VorgangDTO[]>(`${this.apiUrl}/all`, { headers: this.getAuthHeaders() });
  }

  /**
   * Einzelnen Vorgang abrufen
   */
  getVorgang(id: string): Observable<VorgangDTO> {
    return this.http.get<VorgangDTO>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  /**
   * Vorgänge nach Typ
   */
  getVorgaengeByTyp(typ: VorgangTyp): Observable<VorgangDTO[]> {
    return this.http.get<VorgangDTO[]>(`${this.apiUrl}/typ/${typ}`, { headers: this.getAuthHeaders() });
  }

  /**
   * Vorgänge nach Status
   */
  getVorgaengeByStatus(status: VorgangStatus): Observable<VorgangDTO[]> {
    return this.http.get<VorgangDTO[]>(`${this.apiUrl}/status/${status}`, { headers: this.getAuthHeaders() });
  }

  /**
   * Aktuell laufende Vorgänge
   */
  getLaufendeVorgaenge(): Observable<VorgangDTO[]> {
    return this.http.get<VorgangDTO[]>(`${this.apiUrl}/laufend`, { headers: this.getAuthHeaders() });
  }

  /**
   * Rechnungsläufe der letzten X Tage
   */
  getRecentRechnungslaeufe(tage: number = 30): Observable<VorgangDTO[]> {
    const params = new HttpParams().set('tage', tage.toString());
    return this.http.get<VorgangDTO[]>(`${this.apiUrl}/rechnungslaeufe`, { 
      headers: this.getAuthHeaders(), 
      params 
    });
  }

  /**
   * Vorgang-Statistiken
   */
  getVorgangStatistiken(): Observable<VorgangStatistik> {
    return this.http.get<VorgangStatistik>(`${this.apiUrl}/statistiken`, { 
      headers: this.getAuthHeaders() 
    });
  }

  /**
   * Langlaufende Vorgänge (mehr als X Minuten)
   */
  getLanglaufendeVorgaenge(minuten: number = 60): Observable<VorgangDTO[]> {
    const params = new HttpParams().set('minuten', minuten.toString());
    return this.http.get<VorgangDTO[]>(`${this.apiUrl}/langlaufend`, { 
      headers: this.getAuthHeaders(), 
      params 
    });
  }

  /**
   * Vorgang manuell abbrechen
   */
  vorgangAbbrechen(id: string, grund: string): Observable<string> {
    const params = new HttpParams().set('grund', grund);
    return this.http.post<string>(`${this.apiUrl}/${id}/abbrechen`, {}, { 
      headers: this.getAuthHeaders(), 
      params,
      responseType: 'text' as 'json'
    });
  }

  /**
   * Hängengebliebene Vorgänge korrigieren
   */
  korrigiereHaengengebliebene(stundenSchwellwert: number = 24): Observable<string> {
    const params = new HttpParams().set('stundenSchwellwert', stundenSchwellwert.toString());
    return this.http.post<string>(`${this.apiUrl}/korrigieren`, {}, { 
      headers: this.getAuthHeaders(), 
      params,
      responseType: 'text' as 'json'
    });
  }

  // ===============================================================================================
  // ZUSÄTZLICHE HILFSMETHODEN
  // ===============================================================================================

  /**
   * Filtert Vorgänge nach mehreren Kriterien
   */
  filterVorgaenge(
    vorgaenge: VorgangDTO[], 
    filters: {
      typ?: VorgangTyp;
      status?: VorgangStatus;
      automatisch?: boolean;
      vonDatum?: Date;
      bisDatum?: Date;
      suchtext?: string;
    }
  ): VorgangDTO[] {
    return vorgaenge.filter(vorgang => {
      // Typ-Filter
      if (filters.typ && vorgang.typ !== filters.typ) {
        return false;
      }

      // Status-Filter
      if (filters.status && vorgang.status !== filters.status) {
        return false;
      }

      // Automatisch-Filter
      if (filters.automatisch !== undefined && vorgang.automatisch !== filters.automatisch) {
        return false;
      }

      // Datum-Filter
      const startDatum = new Date(vorgang.startZeitpunkt);
      if (filters.vonDatum && startDatum < filters.vonDatum) {
        return false;
      }
      if (filters.bisDatum && startDatum > filters.bisDatum) {
        return false;
      }

      // Suchtext-Filter
      if (filters.suchtext) {
        const suchtext = filters.suchtext.toLowerCase();
        const titelMatch = vorgang.titel?.toLowerCase().includes(suchtext);
        const beschreibungMatch = vorgang.beschreibung?.toLowerCase().includes(suchtext);
        const vorgangsnummerMatch = vorgang.vorgangsnummer?.toLowerCase().includes(suchtext);
        
        if (!titelMatch && !beschreibungMatch && !vorgangsnummerMatch) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Sortiert Vorgänge nach verschiedenen Kriterien
   */
  sortVorgaenge(vorgaenge: VorgangDTO[], sortBy: string, direction: 'asc' | 'desc' = 'desc'): VorgangDTO[] {
    return [...vorgaenge].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (sortBy) {
        case 'startZeitpunkt':
          valueA = new Date(a.startZeitpunkt).getTime();
          valueB = new Date(b.startZeitpunkt).getTime();
          break;
        case 'endeZeitpunkt':
          valueA = a.endeZeitpunkt ? new Date(a.endeZeitpunkt).getTime() : 0;
          valueB = b.endeZeitpunkt ? new Date(b.endeZeitpunkt).getTime() : 0;
          break;
        case 'titel':
          valueA = a.titel?.toLowerCase() || '';
          valueB = b.titel?.toLowerCase() || '';
          break;
        case 'typ':
          valueA = a.typ;
          valueB = b.typ;
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        case 'dauer':
          valueA = a.dauerInMs || 0;
          valueB = b.dauerInMs || 0;
          break;
        case 'erfolgsquote':
          valueA = a.erfolgsquote || 0;
          valueB = b.erfolgsquote || 0;
          break;
        default:
          return 0;
      }

      if (valueA < valueB) {
        return direction === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  /**
   * Berechnet Statistiken für eine Liste von Vorgängen
   */
  berechneStatistiken(vorgaenge: VorgangDTO[]): VorgangStatistik {
    const gesamt = vorgaenge.length;
    const laufend = vorgaenge.filter(v => v.status === VorgangStatus.LAUFEND || v.status === VorgangStatus.GESTARTET).length;
    const erfolgreich = vorgaenge.filter(v => v.status === VorgangStatus.ERFOLGREICH).length;
    const fehler = vorgaenge.filter(v => v.status === VorgangStatus.FEHLER).length;
    const abgebrochen = vorgaenge.filter(v => v.status === VorgangStatus.ABGEBROCHEN).length;

    const abgeschlosseneVorgaenge = vorgaenge.filter(v => v.dauerInMs !== undefined && v.dauerInMs > 0);
    const durchschnittlicheDauerMs = abgeschlosseneVorgaenge.length > 0 
      ? abgeschlosseneVorgaenge.reduce((sum, v) => sum + (v.dauerInMs || 0), 0) / abgeschlosseneVorgaenge.length
      : 0;

    const erfolgsquoteGesamt = gesamt > 0 ? (erfolgreich / gesamt) * 100 : 0;

    return {
      gesamt,
      laufend,
      erfolgreich,
      fehler,
      abgebrochen,
      durchschnittlicheDauerMs,
      erfolgsquoteGesamt
    };
  }
}