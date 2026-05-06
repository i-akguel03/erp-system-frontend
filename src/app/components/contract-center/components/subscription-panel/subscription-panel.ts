import { Component, Input, Output, EventEmitter } from '@angular/core';
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

  selectSubscription(subscription: Subscription): void {
    this.subscriptionSelected.emit(subscription);
  }

  isSelectedSubscription(subscription: Subscription): boolean {
    return this.selectedSubscription?.id === subscription.id;
  }

  getStatusBadgeClass(subscription: Subscription): string {
    switch (subscription.subscriptionStatus?.toUpperCase()) {
      case 'ACTIVE':    return 'bg-success';
      case 'PAUSED':    return 'bg-warning text-dark';
      case 'CANCELLED': return 'bg-danger';
      case 'SUSPENDED': return 'bg-secondary';
      default:          return 'bg-light text-dark';
    }
  }

  getSubscriptionStatusText(subscription: Subscription): string {
    switch (subscription.subscriptionStatus?.toUpperCase()) {
      case 'ACTIVE':    return 'Aktiv';
      case 'PAUSED':    return 'Pausiert';
      case 'CANCELLED': return 'Gekündigt';
      case 'SUSPENDED': return 'Ausgesetzt';
      default:          return subscription.subscriptionStatus || 'Unbekannt';
    }
  }

  getDaysUntilExpiry(subscription: Subscription): number | null {
    if (!subscription.endDate) return null;
    const diff = new Date(subscription.endDate).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getExpiryText(days: number | null): string {
    if (days === null)  return '∞ Unbegrenzt';
    if (days > 0)       return `${days} Tage`;
    if (days === 0)     return 'Läuft heute ab';
    return `Abgelaufen`;
  }

  getExpiryClass(days: number | null): string {
    if (days === null)    return 'text-muted';
    if (days <= 0)        return 'text-danger fw-semibold';
    if (days <= 30)       return 'text-warning fw-semibold';
    if (days <= 90)       return 'text-body';
    return 'text-muted';
  }
}
