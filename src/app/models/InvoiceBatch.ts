// models/InvoiceBatch.ts

// -------------------- Haupt-Resultat --------------------
export interface InvoiceBatchResult {
  errorMessage?: string;
  batchId: string;
  billingDate: string;                // ISO-String (Backend liefert wahrscheinlich String)
  includeAllPreviousMonths: boolean;
  startTime: string;                  // besser string statt Date, wenn aus Backend
  endTime?: string;
  status: InvoiceBatchStatus;
  totalInvoicesCreated: number;
  totalAmountInvoiced: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  processedDueSchedules: ProcessedDueSchedule[];
  errors: InvoiceBatchError[];
  summary: string;
  duration?: number;                  // ms
}

// -------------------- Progress (für laufende Batches) -----
export interface BatchProgress {
  batchId?: string;
  status: InvoiceBatchStatus;
  progress: number;      // 0..100
  message: string;
  result?: InvoiceBatchResult;  // optional wenn fertig
}

// -------------------- Vorschau ----------------------------
export interface InvoiceBatchPreview {
  analysis: InvoiceBatchAnalysis;
  estimatedTotal: number;
}

export interface InvoiceBatchAnalysis {
  billingDate: string;
  includeAllPreviousMonths: boolean;
  totalDueSchedules: number;
  dueSchedulesByMonth: Record<string, number>;
  dueSchedules: DueSchedule[];
  potentialIssues: string[];
  estimatedDuration: number; // Sekunden
  canProceed: boolean;
  warnings: string[];
}

// -------------------- Einzelne Einträge --------------------
export interface ProcessedDueSchedule {
  dueScheduleId: string;
  subscriptionId: string;
  customerId: string;
  customerName: string;
  productName: string;
  billingMonth: string;
  status: ProcessingStatus;
  invoiceId?: string;
  invoiceNumber?: string;
  amount?: number;
  errorMessage?: string;
  processingTime: string; // Backend liefert ISO-String
}

export interface InvoiceBatchError {
  dueScheduleId?: string;
  subscriptionId?: string;
  customerId?: string;
  errorType: InvoiceBatchErrorType;
  errorMessage: string;
  stackTrace?: string;
  timestamp: string;
}

export interface DueSchedule {
  id: string;
  subscription: Subscription;
  dueDate: string;
  billingMonth: string;
  amount: number;
  status: DueScheduleStatus;
  createdAt: string;
  lastModified?: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  customer?: Customer;
  productId: string;
  product?: Product;
  monthlyPrice?: number;
  startDate: string;
  endDate?: string;
  status: SubscriptionStatus;
  billingDay: number;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  companyName?: string;
  address?: Address;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price?: number;
  category?: string;
}

export interface Address {
  street: string;
  houseNumber: string;
  zipCode: string;
  city: string;
  country: string;
}

export interface CanRunResult {
  canRun: boolean;
  mode: string;
}

// -------------------- Enums --------------------
export enum InvoiceBatchStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  COMPLETED_WITH_ERRORS = 'COMPLETED_WITH_ERRORS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum ProcessingStatus {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  SKIPPED = 'SKIPPED',
  WARNING = 'WARNING'
}

export enum InvoiceBatchErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CUSTOMER_NOT_FOUND = 'CUSTOMER_NOT_FOUND',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  SUBSCRIPTION_INACTIVE = 'SUBSCRIPTION_INACTIVE',
  INVALID_BILLING_DATA = 'INVALID_BILLING_DATA',
  INVOICE_CREATION_FAILED = 'INVOICE_CREATION_FAILED',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION'
}

export enum DueScheduleStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  ERROR = 'ERROR',
  CANCELLED = 'CANCELLED'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CANCELLED = 'CANCELLED',
  SUSPENDED = 'SUSPENDED',
  EXPIRED = 'EXPIRED'
}

// -------------------- Utility --------------------
export const InvoiceBatchUtils = {
  isSuccessful: (r: InvoiceBatchResult) =>
    r.status === InvoiceBatchStatus.COMPLETED && r.errorCount === 0,

  hasWarnings: (r: InvoiceBatchResult) =>
    r.status === InvoiceBatchStatus.COMPLETED_WITH_ERRORS || r.errorCount > 0,

  isRunning: (r: InvoiceBatchResult) =>
    r.status === InvoiceBatchStatus.RUNNING || r.status === InvoiceBatchStatus.PENDING,

  getSuccessRate: (r: InvoiceBatchResult) => {
    const total = r.successCount + r.errorCount + r.skippedCount;
    return total > 0 ? Math.round((r.successCount / total) * 100) : 0;
  },

  formatDuration: (durationMs?: number) => {
    if (!durationMs) return 'Unbekannt';
    const sec = Math.floor(durationMs / 1000);
    const min = Math.floor(sec / 60);
    const remain = sec % 60;
    return min > 0 ? `${min}m ${remain}s` : `${remain}s`;
  },

  groupErrorsByType: (errors: InvoiceBatchError[]) =>
    errors.reduce((groups, e) => {
      (groups[e.errorType] ??= []).push(e);
      return groups;
    }, {} as Record<InvoiceBatchErrorType, InvoiceBatchError[]>)
};
