// models/OpenItem.ts

export interface OpenItem {
  // Basic fields
  id?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  description?: string;
  amount?: number;
  dueDate?: Date | null;
  status?: OpenItemStatus;
    subscriptionId?: string; // Falls direkte Verknüpfung
  
  // Payment fields
  paidAmount?: number;
  paidDate?: Date | null;
  paymentMethod?: string;
  paymentReference?: string;
  
  // Timestamps
  createdDate?: Date | null;
  updatedDate?: Date | null;
  
  // Additional fields
  notes?: string;
  lastReminderDate?: Date | null;
  reminderCount?: number;
  
  // Calculated fields (from backend)
  outstandingAmount?: number;
  overdue?: boolean;
  
  // Customer info (from invoice relation)
  customerId?: string;
  customerName?: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerNumber?: string;
}

export enum OpenItemStatus {
  OPEN = 'OPEN',
  PARTIALLY_PAID = 'PARTIALLY_PAID', 
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE'
}

// Helper type für Status-Labels (für UI)
export const OpenItemStatusLabels = {
  [OpenItemStatus.OPEN]: 'Offen',
  [OpenItemStatus.PARTIALLY_PAID]: 'Teilweise bezahlt',
  [OpenItemStatus.PAID]: 'Bezahlt',
  [OpenItemStatus.CANCELLED]: 'Storniert',
  [OpenItemStatus.OVERDUE]: 'Überfällig'
} as const;

// Helper type für Status-CSS-Klassen (für UI)
export const OpenItemStatusClasses = {
  [OpenItemStatus.OPEN]: 'status-open',
  [OpenItemStatus.PARTIALLY_PAID]: 'status-partial',
  [OpenItemStatus.PAID]: 'status-paid',
  [OpenItemStatus.CANCELLED]: 'status-cancelled',
  [OpenItemStatus.OVERDUE]: 'status-overdue'
} as const;

// DTO für Payment-Requests
export interface PaymentRequest {
  amount: number;
  paymentMethod?: string;
  paymentReference?: string;
}

// DTO für OpenItem-Erstellung
export interface CreateOpenItemRequest {
  invoiceId: string;
  description: string;
  amount: number;
  dueDate: Date;
  notes?: string;
}

// DTO für OpenItem-Updates
export interface UpdateOpenItemRequest {
  description?: string;
  amount?: number;
  dueDate?: Date;
  notes?: string;
}

// Filter-Interface für Abfragen
export interface OpenItemFilter {
  customerId?: string;
  invoiceId?: string;
  status?: OpenItemStatus;
  startDate?: Date;
  endDate?: Date;
  overdue?: boolean;
}

// Statistik-Interface
export interface OpenItemStatistics {
  totalOutstanding: number;
  totalPaid: number;
  overdueCount: number;
  openCount: number;
  paidCount: number;
  averageAmount: number;
}

// Reminder-Interface
export interface ReminderInfo {
  openItemId: string;
  daysSinceLastReminder: number;
  reminderCount: number;
  shouldSendReminder: boolean;
}