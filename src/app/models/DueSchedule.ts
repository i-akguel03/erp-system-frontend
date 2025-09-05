export enum DueStatus {
  PENDING = 'PENDING',      // noch offen
  PARTIAL_PAID = 'PARTIAL_PAID', // teilweise bezahlt
  PAID = 'PAID',            // vollständig bezahlt
  CANCELLED = 'CANCELLED',  // storniert
  OVERDUE = 'OVERDUE'       // überfällig
}

export interface DueSchedule {
  id: string;                   // UUID
  dueNumber: string;            // Fälligkeitsnummer
  subscriptionId: string;       // Zugehöriges Abonnement
  subscriptionNumber?: string;  // optional, Subscription-Nummer
  dueDate: string | null;       // Fälligkeitsdatum
  periodStart?: string | null;  // optional: Start des Abrechnungszeitraums
  periodEnd?: string | null;    // optional: Ende des Abrechnungszeitraums
  paidDate?: string | null;     // Bezahlt am (optional)
  amount: number;               // Betrag
  paidAmount?: number;           // optional, bisher bezahlt
  status: DueStatus;            // Status
  reminderSent?: boolean;       // optional, Mahnung gesendet
  reminderCount?: number;       // optional
  lastReminderDate?: string | null; // optional
  customerName?: string;        // optional, Customer über Contract
  productName?: string;         // optional, Produkt über Contract
  notes?: string;               // optional
}

export interface PaymentDto {
  paymentDate: Date;           // Datum der Zahlung
  amount: number;                // Betrag
  method?: string;               // optional: Zahlungsmethode
  reference?: string;            // optional: Zahlungsreferenz
  notes?: string;                // optional
}

export interface DueScheduleStatistics {
  totalDue: number;            // Summe aller Fälligkeiten
  totalPaid: number;           // Summe bezahlter Fälligkeiten
  totalOverdue: number;        // Summe überfälliger Fälligkeiten
  totalOpen: number;           // Summe offener Fälligkeiten
  countDue: number;            // Anzahl aller Fälligkeiten
  countPaid: number;           // Anzahl bezahlter Fälligkeiten
  countOverdue: number;        // Anzahl überfälliger Fälligkeiten
  countOpen: number;           // Anzahl offener Fälligkeiten
}
