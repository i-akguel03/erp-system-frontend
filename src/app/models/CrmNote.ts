export type NotePriority = 'NIEDRIG' | 'MITTEL' | 'HOCH';

export interface CrmNote {
  id?: string;
  title: string;
  content?: string;
  priority?: NotePriority;
  createdBy?: string;
  customerId?: string;
  customerName?: string;
  contractId?: string;
  contractTitle?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
