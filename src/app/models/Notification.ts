export type NotificationSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
export type NotificationType = string;

export interface AppNotification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  entityType?: string;
  entityId?: string;
}
