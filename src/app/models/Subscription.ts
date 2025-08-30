// src/app/models/Subscription.ts
export interface Subscription {
  id?: string;
  subscriptionNumber: string;
  productName: string;
  monthlyPrice: number;
  startDate: Date;    // <-- jetzt Date statt string
  endDate?: Date;     // optional, ebenfalls Date
  billingCycle: BillingCycle;
  subscriptionStatus: SubscriptionStatus;
  autoRenewal?: boolean;
  contractId?: string;
}

// --- Enums ---
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}
