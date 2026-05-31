export type ActivityType = 'ANRUF' | 'EMAIL' | 'MEETING' | 'AUFGABE' | 'BESUCH' | 'SONSTIGES';
export type ActivityStatus = 'OFFEN' | 'IN_BEARBEITUNG' | 'ABGESCHLOSSEN' | 'ABGESAGT';

export interface CrmActivity {
  id?: string;
  title: string;
  description?: string;
  activityType: ActivityType;
  status?: ActivityStatus;
  activityDate?: Date;
  dueDate?: Date;
  contactPerson?: string;
  result?: string;
  createdBy?: string;
  customerId?: string;
  customerName?: string;
  contractId?: string;
  contractTitle?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
