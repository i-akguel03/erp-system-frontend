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

  // Helpers
  getStatusLabel(status: ScheduleStatus, overdue: boolean): string {
    if (overdue) return 'ÜBERFÄLLIG';
    switch (status) {
      case 'ACTIVE': return 'Aktiv';
      case 'PAUSED': return 'Pausiert';
      case 'SUSPENDED': return 'Ausgesetzt';
      case 'COMPLETED': return 'Abgeschlossen';
      default: return status;
    }
  }

  getStatusClass(status: ScheduleStatus, overdue: boolean): string {
    if (overdue) return 'status-overdue';
    switch (status) {
      case 'ACTIVE': return 'status-active';
      case 'PAUSED': return 'status-paused';
      case 'SUSPENDED': return 'status-suspended';
      case 'COMPLETED': return 'status-completed';
      default: return '';
    }
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
