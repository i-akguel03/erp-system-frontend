import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from '../../../../models/Subscription';
import { Contract } from '../../../../models/Contract';

@Component({
  selector: 'app-subscription-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription-panel.html',
  styleUrls: ['./subscription-panel.scss']
})
export class SubscriptionPanelComponent {
  @Input() subscriptions: Subscription[] = [];
  @Input() selectedContract: Contract | null = null;
  @Input() selectedSubscription: Subscription | null = null;

  @Output() subscriptionSelected = new EventEmitter<Subscription>();
  @Output() createSubscription = new EventEmitter<void>();
  @Output() activateSubscription = new EventEmitter<Subscription>();
  @Output() pauseSubscription = new EventEmitter<Subscription>();
  @Output() terminateSubscription = new EventEmitter<Subscription>();
  @Output() cancelSubscription = new EventEmitter<Subscription>();

  menuSub: Subscription | null = null;
  menuPos = { x: 0, y: 0 };

  selectSubscription(sub: Subscription): void { this.subscriptionSelected.emit(sub); }
  isSelectedSubscription(sub: Subscription): boolean { return this.selectedSubscription?.id === sub.id; }

  openMenu(event: MouseEvent, sub: Subscription): void {
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.menuPos = {
      x: Math.min(rect.right, window.innerWidth - 180),
      y: rect.bottom + 2
    };
    this.menuSub = this.menuSub?.id === sub.id ? null : sub;
  }

  closeMenu(): void { this.menuSub = null; }

  @HostListener('document:click') onDocClick(): void { this.closeMenu(); }
  @HostListener('document:keydown.escape') onEsc(): void { this.closeMenu(); }

  onActivate(): void { if (this.menuSub) { this.activateSubscription.emit(this.menuSub); this.closeMenu(); } }
  onPause(): void { if (this.menuSub) { this.pauseSubscription.emit(this.menuSub); this.closeMenu(); } }
  onTerminate(): void { if (this.menuSub) { this.terminateSubscription.emit(this.menuSub); this.closeMenu(); } }
  onCancel(): void { if (this.menuSub) { this.cancelSubscription.emit(this.menuSub); this.closeMenu(); } }

  canActivate(sub: Subscription): boolean {
    const s = sub.subscriptionStatus?.toUpperCase();
    return s === 'DRAFT' || s === 'PAUSED' || s === 'SUSPENDED' || s === 'TERMINATED' || s === 'EXPIRED';
  }
  canPause(sub: Subscription): boolean { return sub.subscriptionStatus?.toUpperCase() === 'ACTIVE'; }
  canTerminate(sub: Subscription): boolean {
    const s = sub.subscriptionStatus?.toUpperCase();
    return s === 'ACTIVE' || s === 'PAUSED' || s === 'SUSPENDED';
  }
  canCancel(sub: Subscription): boolean {
    const s = sub.subscriptionStatus?.toUpperCase();
    return s === 'ACTIVE' || s === 'PAUSED' || s === 'SUSPENDED' || s === 'TERMINATED';
  }

  hasActions(sub: Subscription): boolean {
    return this.canActivate(sub) || this.canPause(sub) || this.canTerminate(sub) || this.canCancel(sub);
  }

  getStatusIcon(sub: Subscription): string {
    const s = sub.subscriptionStatus?.toUpperCase();
    const m: any = { ACTIVE:'bi-check-circle-fill text-success', PAUSED:'bi-pause-circle-fill text-warning', CANCELLED:'bi-x-circle-fill text-danger', TERMINATED:'bi-x-circle text-secondary', EXPIRED:'bi-clock-history text-danger', SUSPENDED:'bi-dash-circle-fill text-secondary' };
    return m[s ?? ''] ?? 'bi-circle text-muted';
  }

  getStatusBadgeClass(sub: Subscription): string {
    const s = sub.subscriptionStatus?.toUpperCase();
    const m: any = { ACTIVE:'bg-success', PAUSED:'bg-warning text-dark', CANCELLED:'bg-danger', TERMINATED:'bg-secondary', EXPIRED:'bg-secondary', SUSPENDED:'bg-secondary' };
    return m[s ?? ''] ?? 'bg-light text-dark';
  }

  getSubscriptionStatusText(sub: Subscription): string {
    const s = sub.subscriptionStatus?.toUpperCase();
    const m: any = { ACTIVE:'Aktiv', PAUSED:'Pausiert', CANCELLED:'Storniert', TERMINATED:'Gekündigt', EXPIRED:'Abgelaufen', SUSPENDED:'Ausgesetzt' };
    return m[s ?? ''] ?? sub.subscriptionStatus ?? 'Unbekannt';
  }

  billingCycleLabel(cycle?: string): string {
    const m: any = { MONTHLY:'Monatlich', QUARTERLY:'Vierteljährlich', SEMI_ANNUALLY:'Halbjährlich', ANNUALLY:'Jährlich' };
    return m[cycle ?? ''] ?? cycle ?? '–';
  }

  formatDate(d: any): string {
    if (!d) return '–';
    try { return new Date(d).toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' }); } catch { return '–'; }
  }

  getDaysUntilExpiry(sub: Subscription): number | null {
    if (!sub.endDate) return null;
    return Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / 86_400_000);
  }

  getExpiryText(days: number | null): string {
    if (days === null) return '∞ Unbegrenzt';
    if (days > 0) return `${days} Tage`;
    if (days === 0) return 'Läuft heute ab';
    return 'Abgelaufen';
  }

  getExpiryClass(days: number | null): string {
    if (days === null) return 'text-muted';
    if (days <= 0) return 'text-danger fw-semibold';
    if (days <= 30) return 'text-warning fw-semibold';
    if (days <= 90) return 'text-body';
    return 'text-muted';
  }
}
