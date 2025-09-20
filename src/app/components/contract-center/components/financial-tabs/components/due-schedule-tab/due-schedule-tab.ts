import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DueSchedule, ScheduleStatus } from '../../../../../../models/DueSchedule';
import { DueScheduleService } from '../../../../../../services/due-schedule-service';

@Component({
  selector: 'app-due-schedule-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './due-schedule-tab.html',
  styleUrls: ['./due-schedule-tab.scss']
})
export class DueScheduleTabComponent {
  @Input() dueSchedules: DueSchedule[] = [];

  loading = false;
  error: string | null = null;

  // Modal
  showNewScheduleModal = false;
  newSchedule: Partial<DueSchedule> = {};
  subscriptions: any[] = []; // später via Service laden

  constructor(private scheduleService: DueScheduleService) {}

  clearError(): void {
    this.error = null;
  }

  // Modal-Handling
  openNewScheduleModal(): void {
    this.newSchedule = {};
    this.showNewScheduleModal = true;
  }

  closeNewScheduleModal(): void {
    this.showNewScheduleModal = false;
  }

  createSchedule(): void {
    if (!this.newSchedule.dueDate || !this.newSchedule.subscriptionId) return;
    this.scheduleService.createDueSchedule(this.newSchedule as DueSchedule).subscribe({
      next: created => {
        this.dueSchedules.push(created);
        this.closeNewScheduleModal();
      },
      error: err => this.handleApiError(err, 'Fehler beim Erstellen der Fälligkeit')
    });
  }

  // Helpers - Zeigt nur den Backend-Status an
  getStatusLabel(status: ScheduleStatus, overdue: boolean): string {
    switch (status) {
      case 'ACTIVE': return 'Aktiv';
      case 'PAUSED': return 'Pausiert';
      case 'SUSPENDED': return 'Ausgesetzt';
      case 'COMPLETED': return 'Abgeschlossen';
      default: return status;
    }
  }

  // Status-Klassen berücksichtigen weiterhin überdue für visuelle Kennzeichnung
  getStatusClass(status: ScheduleStatus, overdue: boolean): string {
    // Basis-Status-Klasse
    let baseClass = '';
    switch (status) {
      case 'ACTIVE': baseClass = 'status-active'; break;
      case 'PAUSED': baseClass = 'status-paused'; break;
      case 'SUSPENDED': baseClass = 'status-suspended'; break;
      case 'COMPLETED': baseClass = 'status-completed'; break;
      default: baseClass = '';
    }

    // Wenn überfällig, zusätzliche visuelle Kennzeichnung
    if (overdue && status === 'ACTIVE') {
      return 'status-overdue'; // Nur aktive überfällige Posten rot markieren
    }

    return baseClass;
  }

  isOverdue(dueDate: string | Date): boolean {
    return new Date(dueDate).getTime() < Date.now();
  }

  private handleApiError(err: any, defaultMessage: string): void {
    console.error('API Error:', err);
    this.loading = false;
    this.error = err.error?.message || defaultMessage;
  }
}