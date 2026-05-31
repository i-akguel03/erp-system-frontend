export interface KontenblattEintrag {
  openItemId?: string;
  datum?: Date | null;
  /** "FORDERUNG" = Minus | "ZAHLUNG" = Plus */
  typ?: 'FORDERUNG' | 'ZAHLUNG';
  beschreibung?: string;
  betrag?: number;
  bewegung?: number;
  saldo?: number;
  rechnungsnummer?: string;
  zahlungsart?: string;
  zahlungsreferenz?: string;
  openItemStatus?: string;
  offenerBetrag?: number;
}
