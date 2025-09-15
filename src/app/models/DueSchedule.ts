export enum DueStatus {
  ACTIVE = 'ACTIVE',        // noch offen
  PAUSED = 'PAUSED', // teilweise bezahlt (Backend noch nicht aktiv)
  SUSPENDED = 'SUSPENDED',              // vollständig bezahlt
  COMPLETED = 'COMPLETED',    // storniert

}

// Status wie im Backend
export type ScheduleStatus = 'ACTIVE' | 'PAUSED' | 'SUSPENDED' | 'COMPLETED';

export interface DueSchedule {
  paidDate: any;
  id: string;                   // UUID
  dueNumber: string;            // Fälligkeitsnummer
  subscriptionId: string;       // Zugehöriges Abonnement
  subscriptionNumber?: string;  // optional

  dueDate: string | null;       // Fälligkeitsdatum
  periodStart: string | null;   // Start des Abrechnungszeitraums
  periodEnd: string | null;     // Ende des Abrechnungszeitraums

  status: ScheduleStatus;       // Backend-Status
  overdue: boolean;             // abgeleitet
  notes?: string;               // optional

  customerName?: string;        // über Subscription → Customer
  productName?: string;         // über Subscription → Product
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
