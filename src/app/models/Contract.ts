import { Subscription } from "./Subscription";

export interface Contract {
  id?: string;
  contractNumber?: string;
  contractTitle?: string;
  customerId?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  subscriptions?: Subscription[];
  contractStatus?: string;
}
