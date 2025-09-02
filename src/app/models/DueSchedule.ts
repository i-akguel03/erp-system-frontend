export interface DueSchedule {
  id: string;                   // UUID
  dueNumber: string;            // Fälligkeitsnummer
  subscriptionId: string;       // Zugehöriges Abonnement
  dueDate: Date | null;         // Fälligkeitsdatum
  paidDate: Date | null;        // Bezahlt am (optional)
  amount: number;               // Betrag
  status: DueStatus;            // Status
  reminderSent?: boolean;       // optional, ob Mahnung gesendet wurde
}

export enum DueStatus {
  OPEN = 'OPEN',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE'
}

// DTO für Zahlungen
export interface PaymentDto {
  paymentDate: Date;
  amount: number;
  method?: string;             // optional: Zahlungsmethode
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

