import { Address } from "./Address.js";
import { Contract } from "./Contract.js";


export interface Customer {
  id?: string;
  customerNumber?: string;
  firstName: string;
  lastName: string;
  email: string;
  tel: string;
  residentialAddress?: Address;
  billingAddress?: Address;
  shippingAddress?: Address;
  contracts?: Contract[];
}
