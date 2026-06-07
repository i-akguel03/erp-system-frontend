// src/app/models/Subscription.ts
export interface Subscription {
  id?: string;
  subscriptionNumber?: string; // optional beim Erstellen, Backend generiert
  productId: string;           // Pflichtfeld beim Erstellen
  productName?: string;        // optional, kann vom Backend gefüllt werden
  startDate: Date;
  endDate?: Date;
  billingCycle: BillingCycle;
  subscriptionStatus?: SubscriptionStatus; // optional beim Erstellen, default ACTIVE
  autoRenewal?: boolean;
  contractId: string;          // Pflichtfeld beim Erstellen
}

// --- Enums ---
export enum SubscriptionStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMI_ANNUALLY = 'SEMI_ANNUALLY',
  ANNUALLY = 'ANNUALLY'
}
