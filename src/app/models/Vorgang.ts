// models/Vorgang.ts

export enum VorgangTyp {
  RECHNUNGSLAUF = 'RECHNUNGSLAUF',
  VERLAENGERUNGSLAUF = 'VERLAENGERUNGSLAUF',
  VERTRAGSERNEUERUNG = 'VERTRAGSERNEUERUNG',
  DATENIMPORT = 'DATENIMPORT',
  STATUS_AENDERUNG = 'STATUS_AENDERUNG',
  ZAHLUNGSEINGANG = 'ZAHLUNGSEINGANG',
  BULK_OPERATION = 'BULK_OPERATION',
  SYSTEM_WARTUNG = 'SYSTEM_WARTUNG',
  REPORT_GENERATION = 'REPORT_GENERATION'
}

export enum VorgangStatus {
  GESTARTET = 'GESTARTET',
  LAUFEND = 'LAUFEND',
  ERFOLGREICH = 'ERFOLGREICH',
  FEHLER = 'FEHLER',
  ABGEBROCHEN = 'ABGEBROCHEN'
}

export interface VorgangDTO {
  id: string;
  vorgangsnummer?: string;
  typ: VorgangTyp;
  status: VorgangStatus;
  titel: string;
  beschreibung?: string;
  startZeitpunkt: string; // ISO DateTime String
  endeZeitpunkt?: string; // ISO DateTime String
  ausgeloestVon?: string;
  automatisch: boolean;
  anzahlVerarbeitet?: number;
  anzahlErfolgreich?: number;
  anzahlFehler?: number;
  gesamtbetrag?: number;
  fehlerprotokoll?: string;
  // Berechnete Felder
  dauerInMs?: number;
  erfolgsquote?: number;
}

// Alias für Kompatibilität mit bestehendem Code
export type Vorgang = VorgangDTO;

export interface VorgangStatistik {
  gesamt: number;
  laufend: number;
  erfolgreich: number;
  fehler: number;
  abgebrochen: number;
  durchschnittlicheDauerMs: number;
  erfolgsquoteGesamt: number;
}

// Hilfsfunktionen für Vorgang
export class VorgangHelper {
  
  /**
   * Formatiert die Dauer in lesbare Form
   */
  static formatDauer(dauerInMs?: number): string {
    if (!dauerInMs) return '-';
    
    const sekunden = Math.floor(dauerInMs / 1000);
    const minuten = Math.floor(sekunden / 60);
    const stunden = Math.floor(minuten / 60);
    
    if (stunden > 0) {
      return `${stunden}h ${minuten % 60}m ${sekunden % 60}s`;
    } else if (minuten > 0) {
      return `${minuten}m ${sekunden % 60}s`;
    } else {
      return `${sekunden}s`;
    }
  }

  /**
   * Berechnet die Dauer zwischen Start und Ende
   */
  static berechneDauer(startZeitpunkt: string, endeZeitpunkt?: string): number {
    const start = new Date(startZeitpunkt);
    const ende = endeZeitpunkt ? new Date(endeZeitpunkt) : new Date();
    return ende.getTime() - start.getTime();
  }

  /**
   * Prüft ob ein Vorgang noch läuft
   */
  static istLaufend(status: VorgangStatus): boolean {
    return status === VorgangStatus.GESTARTET || status === VorgangStatus.LAUFEND;
  }

  /**
   * Gibt die CSS-Klasse für den Status zurück
   */
  static getStatusClass(status: VorgangStatus): string {
    switch (status) {
      case VorgangStatus.ERFOLGREICH: return 'status-success';
      case VorgangStatus.LAUFEND: 
      case VorgangStatus.GESTARTET: return 'status-running';
      case VorgangStatus.FEHLER: return 'status-error';
      case VorgangStatus.ABGEBROCHEN: return 'status-cancelled';
      default: return 'status-unknown';
    }
  }

  /**
   * Gibt ein benutzerfreundliches Label für den Typ zurück
   */
  static getTypLabel(typ: VorgangTyp): string {
    switch (typ) {
      case VorgangTyp.RECHNUNGSLAUF: return 'Rechnungslauf';
      case VorgangTyp.VERLAENGERUNGSLAUF: return 'Verlängerungslauf';
      case VorgangTyp.VERTRAGSERNEUERUNG: return 'Vertragserneuerung';
      case VorgangTyp.DATENIMPORT: return 'Datenimport';
      case VorgangTyp.STATUS_AENDERUNG: return 'Status-Änderung';
      case VorgangTyp.ZAHLUNGSEINGANG: return 'Zahlungseingang';
      case VorgangTyp.BULK_OPERATION: return 'Bulk-Operation';
      case VorgangTyp.SYSTEM_WARTUNG: return 'System-Wartung';
      case VorgangTyp.REPORT_GENERATION: return 'Report-Generierung';
      default: return typ;
    }
  }

  /**
   * Gibt ein benutzerfreundliches Label für den Status zurück
   */
  static getStatusLabel(status: VorgangStatus): string {
    switch (status) {
      case VorgangStatus.GESTARTET: return 'Gestartet';
      case VorgangStatus.LAUFEND: return 'Läuft';
      case VorgangStatus.ERFOLGREICH: return 'Erfolgreich';
      case VorgangStatus.FEHLER: return 'Fehler';
      case VorgangStatus.ABGEBROCHEN: return 'Abgebrochen';
      default: return status;
    }
  }

  /**
   * Formatiert die Erfolgsquote
   */
  static formatErfolgsquote(erfolgsquote?: number | null): string {
    if (erfolgsquote === undefined || erfolgsquote === null || isNaN(erfolgsquote)) {
      return '-';
    }
    return `${erfolgsquote.toFixed(1)}%`;
  }
}