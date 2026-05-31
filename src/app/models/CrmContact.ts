export interface CrmContact {
  id?: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  position?: string;
  department?: string;
  notes?: string;
  primaryContact?: boolean;
  customerId?: string;
  customerName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
