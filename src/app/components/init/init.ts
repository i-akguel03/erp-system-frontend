import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InitService } from '../../services/init.service';
import { NotificationService } from '../../services/notification.service';

interface ActionResult {
  message: string;
  success: boolean;
}

@Component({
  selector: 'app-init',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './init.html',
})
export class InitComponent {
  loading: string | null = null;
  result: ActionResult | null = null;

  billingDate: string = new Date().toISOString().split('T')[0];

  showClearModal = false;
  showClearBusinessModal = false;
  deletePassword = '';
  deleteLoading = false;

  constructor(
    private initService: InitService,
    private notification: NotificationService
  ) {}

  private run(label: string, obs: ReturnType<InitService['initFull']>): void {
    if (this.loading) return;
    this.loading = label;
    this.result = null;
    obs.subscribe({
      next: msg => {
        this.loading = null;
        this.result = { message: msg, success: true };
        this.notification.success(msg);
      },
      error: err => {
        this.loading = null;
        const msg = err.error || err.message || 'Fehler beim Ausführen der Aktion';
        this.result = { message: msg, success: false };
        this.notification.error(msg);
      }
    });
  }

  initFull(): void        { this.run('full',        this.initService.initFull()); }
  initBasic(): void       { this.run('basic',       this.initService.initBasic()); }
  initRealistic(): void   { this.run('realistic',   this.initService.initRealistic()); }
  initDevelopment(): void { this.run('development', this.initService.initDevelopment()); }
  initDemo(): void        { this.run('demo',        this.initService.initDemo()); }
  status(): void          { this.run('status',      this.initService.status()); }
  repair(): void          { this.run('repair',      this.initService.repair()); }
  maintenance(): void     { this.run('maintenance', this.initService.maintenance()); }

  initFullWithBilling(): void {
    this.run('fullBilling', this.initService.initFullWithBilling(this.billingDate));
  }

  confirmClearAll(): void {
    if (this.deleteLoading) return;
    this.deleteLoading = true;
    this.initService.clearAll(this.deletePassword).subscribe({
      next: msg => {
        this.deleteLoading = false;
        this.showClearModal = false;
        this.deletePassword = '';
        this.result = { message: msg, success: true };
        this.notification.success(msg);
      },
      error: err => {
        this.deleteLoading = false;
        const msg = err.error || err.message || 'Fehler beim Löschen';
        this.result = { message: msg, success: false };
        this.notification.error(msg);
      }
    });
  }

  confirmClearBusiness(): void {
    if (this.deleteLoading) return;
    this.deleteLoading = true;
    this.initService.clearBusiness(this.deletePassword).subscribe({
      next: msg => {
        this.deleteLoading = false;
        this.showClearBusinessModal = false;
        this.deletePassword = '';
        this.result = { message: msg, success: true };
        this.notification.success(msg);
      },
      error: err => {
        this.deleteLoading = false;
        const msg = err.error || err.message || 'Fehler beim Löschen';
        this.result = { message: msg, success: false };
        this.notification.error(msg);
      }
    });
  }

  openClearModal(): void {
    this.deletePassword = '';
    this.showClearModal = true;
  }

  openClearBusinessModal(): void {
    this.deletePassword = '';
    this.showClearBusinessModal = true;
  }

  isLoading(key: string): boolean {
    return this.loading === key;
  }

  anyLoading(): boolean {
    return this.loading !== null;
  }
}
