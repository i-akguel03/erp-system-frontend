import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private messageService: MessageService) {}

  success(detail: string): void {
    this.messageService.add({ severity: 'success', summary: 'Erfolg', detail, life: 3000 });
  }

  error(detail: string): void {
    this.messageService.add({ severity: 'error', summary: 'Fehler', detail, life: 5000 });
  }

  warn(detail: string): void {
    this.messageService.add({ severity: 'warn', summary: 'Warnung', detail, life: 4000 });
  }
}
