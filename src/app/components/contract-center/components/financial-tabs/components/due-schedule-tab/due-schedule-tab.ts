import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DueSchedule, ScheduleStatus } from '../../../../../../models/DueSchedule';

@Component({
  selector: 'app-due-schedule-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './due-schedule-tab.html',
  styleUrls: ['./due-schedule-tab.scss']
})
export class DueScheduleTabComponent {
  @Input() dueSchedules: DueSchedule[] = [];

  // Status Badge Classes (wie in der List Component)
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

  // Status Labels (wie in der List Component)
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

  // Tage bis Fälligkeit berechnen
  getDaysUntilDue(dueDate: string | Date): number {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Warnung CSS-Klasse basierend auf Fälligkeitsdatum
  getDueDateWarningClass(dueDate: string | Date): string {
    const days = this.getDaysUntilDue(dueDate);
    if (days < 0) return 'text-danger'; // überfällig
    if (days <= 7) return 'text-warning'; // bald fällig
    return 'text-success'; // normal
  }

  // Icon basierend auf Status und Fälligkeitsdatum
  getDueDateIcon(dueDate: string | Date, status: string): string {
    if (status === 'SUSPENDED') return 'fas fa-check-circle text-success';
    if (status === 'COMPLETED') return 'fas fa-times-circle text-secondary';
    
    const days = this.getDaysUntilDue(dueDate);
    if (days < 0) return 'fas fa-exclamation-triangle text-danger';
    if (days <= 7) return 'fas fa-clock text-warning';
    return 'fas fa-calendar text-primary';
  }

  // Prüfen ob überfällig
  isOverdue(dueDate: string | Date): boolean {
    return this.getDaysUntilDue(dueDate) < 0;
  }

  // Math für Template
  Math = Math;
}