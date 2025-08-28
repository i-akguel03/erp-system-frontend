import { Subscription } from "./Subscription";


export interface Contract {
  id?: string;
  contractNumber?: string;
  contractTitle?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  subscriptions?: Subscription[];
  status?: string;
}
