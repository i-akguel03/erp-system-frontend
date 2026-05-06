import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DueScheduleService } from '../../services/due-schedule-service';
import { DueSchedule, ScheduleStatus } from '../../models/DueSchedule';
import { Dialog } from 'primeng/dialog';

@Component({
  selector: 'app-due-schedule-list',
  standalone: true,
  imports: [CommonModule, FormsModule, Dialog],
  templateUrl: './schedule-list.html',
  styleUrls: ['./schedule-list.scss'],
})
export class DueScheduleListComponent implements OnInit {
  schedules: DueSchedule[] = [];
  filteredSchedules: DueSchedule[] = [];
  loading = false;
  error: string | null = null;
  searchTerm: string = '';

  // Modal für neue Fälligkeit
  showNewScheduleModal = false;
  newSchedule: Partial<DueSchedule> = {};

  constructor(private scheduleService: DueScheduleService) {}

  ngOnInit(): void {
    this.loadSchedules();
  }

  clearError(): void {
    this.error = null;
  }

  // --- Load ---
  loadSchedules(): void {
    this.loading = true;
    this.error = null;
    this.scheduleService.getAllDueSchedules().subscribe({
      next: data => {
        this.schedules = data;
        this.filteredSchedules = [...this.schedules];
        this.loading = false;
      },
      error: err => this.handleApiError(err, 'Fehler beim Laden der Fälligkeiten')
    });
  }

  // --- Filter ---
  filterSchedules(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredSchedules = this.schedules.filter(s =>
      s.dueNumber?.toLowerCase().includes(term) ||
      s.subscriptionId?.toLowerCase().includes(term) ||
      s.status?.toLowerCase().includes(term)
    );
  }

  resetFilter(): void {
    this.searchTerm = '';
    this.filteredSchedules = [...this.schedules];
  }

  // --- Neue Fälligkeit Modal ---
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
        this.schedules.push(created);
        this.filteredSchedules = [...this.schedules];
        this.closeNewScheduleModal();
      },
      error: err => this.handleApiError(err, 'Fehler beim Erstellen der Fälligkeit')
    });
  }

  // --- Helpers ---
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

  private handleApiError(err: any, defaultMessage: string): void {
    console.error('API Error:', err);
    this.loading = false;
    this.error = err.error?.message || defaultMessage;
  }
}
