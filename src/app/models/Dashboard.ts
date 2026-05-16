export interface DashboardKpiDto {
  totalCustomers: number;
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
  openInvoicesCount: number;
  openInvoicesTotalAmount: number;
  totalOutstandingAmount: number;
  overdueItemsCount: number;
  overdueItemsAmount: number;
}

export interface MonthlyRevenueDto {
  month: number;
  year: number;
  monthLabel: string;
  totalAmount: number;
  invoiceCount: number;
}

export interface StatusBreakdown {
  count: number;
  amount: number;
}

export interface AgingBreakdown {
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  over90days: number;
}

export interface OpenItemsOverviewDto {
  totalOutstandingAmount: number;
  totalOpenCount: number;
  open: StatusBreakdown;
  partiallyPaid: StatusBreakdown;
  overdue: StatusBreakdown;
  aging: AgingBreakdown;
}

export interface OutstandingPaymentsDto {
  totalOutstandingAmount: number;
  totalOutstandingCount: number;
  overdueAmount: number;
  overdueCount: number;
  partiallyPaidAmount: number;
  partiallyPaidCount: number;
  totalCollectedAmount: number;
}
