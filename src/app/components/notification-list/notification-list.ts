import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationApiService } from '../../services/notification-api.service';
import { AppNotification, NotificationSeverity } from '../../models/Notification';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-list.html'
})
export class NotificationListComponent implements OnInit {
  items: AppNotification[] = [];
  loading = false;
  markingAll = false;
  error = '';

  page = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;

  constructor(private api: NotificationApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.api.getNotifications(this.page, this.pageSize).subscribe({
      next: (res) => {
        this.items = res.items;
        this.totalElements = res.totalElements;
        this.totalPages = res.totalPages;
        this.loading = false;
      },
      error: () => {
        this.error = 'Benachrichtigungen konnten nicht geladen werden.';
        this.loading = false;
      }
    });
  }

  markAsRead(n: AppNotification): void {
    if (n.read) return;
    this.api.markAsRead(n.id).subscribe({
      next: (updated) => {
        const idx = this.items.findIndex(i => i.id === updated.id);
        if (idx >= 0) this.items[idx] = updated;
      }
    });
  }

  markAllRead(): void {
    this.markingAll = true;
    this.api.markAllRead().subscribe({
      next: () => {
        this.items = this.items.map(i => ({ ...i, read: true }));
        this.markingAll = false;
      },
      error: () => { this.markingAll = false; }
    });
  }

  delete(n: AppNotification, event: Event): void {
    event.stopPropagation();
    this.api.delete(n.id).subscribe({
      next: () => {
        this.items = this.items.filter(i => i.id !== n.id);
        this.totalElements = Math.max(0, this.totalElements - 1);
      }
    });
  }

  goToPage(p: number): void {
    if (p < 0 || p >= this.totalPages) return;
    this.page = p;
    this.load();
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  get unreadCount(): number {
    return this.items.filter(i => !i.read).length;
  }

  severityIcon(s: NotificationSeverity): string {
    switch (s) {
      case 'SUCCESS': return 'bi-check-circle-fill text-success';
      case 'WARNING': return 'bi-exclamation-triangle-fill text-warning';
      case 'ERROR':   return 'bi-x-circle-fill text-danger';
      default:        return 'bi-info-circle-fill text-info';
    }
  }

  severityBg(s: NotificationSeverity): string {
    switch (s) {
      case 'SUCCESS': return 'border-success';
      case 'WARNING': return 'border-warning';
      case 'ERROR':   return 'border-danger';
      default:        return 'border-info';
    }
  }

  trackById(_i: number, n: AppNotification): string { return n.id; }
}
