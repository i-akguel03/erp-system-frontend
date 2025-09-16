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

  selectSubscription(subscription: Subscription): void {
    this.subscriptionSelected.emit(subscription);
  }

  isSelectedSubscription(subscription: Subscription): boolean {
    return this.selectedSubscription?.id === subscription.id;
  }

  getSubscriptionStatusClass(subscription: Subscription): string {
    switch (subscription.subscriptionStatus?.toUpperCase()) {
      case 'ACTIVE':
        return 'badge bg-success';
      case 'PAUSED':
        return 'badge bg-warning text-dark';
      case 'CANCELLED':
        return 'badge bg-danger';
      case 'SUSPENDED':
        return 'badge bg-secondary';
      default:
        return 'badge bg-light text-dark';
    }
  }

  getSubscriptionStatusText(subscription: Subscription): string {
    switch (subscription.subscriptionStatus?.toUpperCase()) {
      case 'ACTIVE':
        return 'Aktiv';
      case 'PAUSED':
        return 'Pausiert';
      case 'CANCELLED':
        return 'Gekündigt';
      case 'SUSPENDED':
        return 'Ausgesetzt';
      default:
        return subscription.subscriptionStatus || 'Unbekannt';
    }
  }

  getDaysUntilExpiry(subscription: Subscription): number | null {
    if (!subscription.endDate) return null;
    
    const endDate = new Date(subscription.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getExpiryWarningClass(days: number | null): string {
    if (days === null) return '';
    if (days < 0) return 'text-danger';
    if (days <= 30) return 'text-warning';
    return 'text-success';
  }
}