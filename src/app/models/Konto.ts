export type KontoTyp = 'AKTIV' | 'PASSIV' | 'AUFWAND' | 'ERTRAG';

export interface Konto {
  kontonummer: number;
  bezeichnung: string;
  kontoTyp: KontoTyp;
  kontoKlasse: string;
  sammelkonto: boolean;
  aktiv: boolean;
  beschreibungLang?: string;
  saldo?: number;
}
