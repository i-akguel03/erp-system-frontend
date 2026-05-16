export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  changedBy: string;
  changedAt: string;
  oldValues?: string;
  newValues?: string;
  methodName?: string;
}

export interface AuditPage {
  content: AuditLog[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
