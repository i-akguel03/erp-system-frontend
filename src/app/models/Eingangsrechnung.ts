export type EingangsrechnungStatus = 'ERFASST' | 'GEPRUEFT' | 'FREIGEGEBEN' | 'BEZAHLT' | 'STORNIERT';

export interface Eingangsrechnung {
  id?: string;
  eingangsrechnungsnummer?: string;
  lieferantenRechnungsnummer?: string;
  lieferantId?: string;
  lieferantName?: string;
  eingangsDatum?: string;
  rechnungsDatum?: string;
  faelligDatum?: string;
  nettobetrag?: number;
  steuersatz?: number;
  steuerbetrag?: number;
  bruttobetrag?: number;
  status?: EingangsrechnungStatus;
  aufwandskontoNr?: number;
  buchungssatzId?: string;
  gezahltAm?: string;
  zahlungsreferenz?: string;
  notizen?: string;
}

export interface EingangsrechnungErfassenRequest {
  lieferantId: string;
  lieferantenRechnungsnummer?: string;
  eingangsDatum: string;
  rechnungsDatum: string;
  faelligDatum: string;
  nettobetrag: number;
  steuersatz: number;
  aufwandskontoNr: number;
  notizen?: string;
}

export interface ZahlungRequest {
  zahlungsreferenz?: string;
  gezahltAm: string;
}
