export interface Subscription {
  id?: string;
  subscriptionNumber?: string;
  productName: string;
  monthlyPrice: number;
  startDate: string;
  endDate?: string;
  billingCycle: string;
  subscriptionStatus: string;
  autoRenewal: boolean;
  contractId?: string;
  taxRate?: number;
  quantity?: number;
  unit?: string;
}
