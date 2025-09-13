export enum DueStatus {
  PENDING = 'PENDING',        // noch offen
  PARTIAL_PAID = 'PARTIAL_PAID', // teilweise bezahlt (Backend noch nicht aktiv)
  PAID = 'PAID',              // vollständig bezahlt
  CANCELLED = 'CANCELLED',    // storniert
  OVERDUE = 'OVERDUE'         // überfällig
}

export interface DueSchedule {
  id: string;                   // UUID
  dueNumber: string;            // Fälligkeitsnummer
  subscriptionId: string;       // Zugehöriges Abonnement
  subscriptionNumber?: string;  // optional, Subscription-Nummer

  dueDate: string | null;       // Fälligkeitsdatum
  periodStart: string | null;   // Start des Abrechnungszeitraums
  periodEnd: string | null;     // Ende des Abrechnungszeitraums

  status: DueStatus;            // Status
  notes?: string;               // optional Notizen

  // erweiterte Infos fürs UI (über Contract → Customer/Product)
  customerName?: string;
  productName?: string;
}

export interface DueScheduleStatistics {
  totalDue: number;
  totalPaid: number;
  totalOverdue: number;
  totalOpen: number;
  countDue: number;
  countPaid: number;
  countOverdue: number;
  countOpen: number;
}
