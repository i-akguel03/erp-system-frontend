export type BelegTyp = 'RECHNUNG' | 'ZAHLUNG_EINGANG' | 'GUTSCHRIFT' | 'EINGANGSRECHNUNG' | 'ZAHLUNG_AUSGANG' | 'MANUELLE_BUCHUNG';
export type BuchungsTyp = 'SOLL' | 'HABEN';
export type BuchungStatus = 'ENTWURF' | 'GEBUCHT' | 'STORNIERT';

export interface Buchungsposition {
  id?: number;
  kontoNummer: number;
  kontoBezeichnung?: string;
  buchungsTyp: BuchungsTyp;
  betrag: number;
  beschreibung?: string;
  kostenstelle?: string;
}

export interface Buchungssatz {
  id?: string;
  buchungsnummer?: string;
  buchungsDatum?: string;
  valutaDatum?: string;
  beschreibung?: string;
  belegTyp?: BelegTyp;
  belegReferenzId?: string;
  belegReferenzNummer?: string;
  geschaeftsjahr?: number;
  monat?: number;
  status?: BuchungStatus;
  gebuchtVon?: string;
  gebuchtAm?: string;
  stornoVonId?: string;
  positionen?: Buchungsposition[];
  sumSoll?: number;
  sumHaben?: number;
  ausgeglichen?: boolean;
}
