import { Subscription } from "./Subscription";


export type SubscriptionStatus = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'EXPIRED';


export interface Contract {
  id?: string;
  contractNumber?: string;
  contractTitle?: string;
  customerId?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  subscriptions?: Subscription[];
  contractStatus?: SubscriptionStatus;
}
