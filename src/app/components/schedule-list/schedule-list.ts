import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SortPipe } from '../../shared/pipes/sort.pipe';
import { ListBase } from '../../shared/utils/list-base';
import { ListToolbarComponent } from '../../shared/components/list-toolbar/list-toolbar.component';
import { ListStatusComponent } from '../../shared/components/list-status/list-status.component';
import { DueScheduleService } from '../../services/due-schedule-service';
import { DueSchedule, ScheduleStatus } from '../../models/DueSchedule';
import { Dialog } from 'primeng/dialog';

@Component({
  selector: 'app-due-schedule-list',
  standalone: true,
  imports: [CommonModule, FormsModule, Dialog, SortPipe, ListToolbarComponent, ListStatusComponent],
  templateUrl: './schedule-list.html',
  styleUrls: ['./schedule-list.scss'],
})
export class DueScheduleListComponent extends ListBase<DueSchedule> implements OnInit {
  schedules: DueSchedule[] = [];
  filteredSchedules: DueSchedule[] = [];

  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;

  showNewScheduleModal = false;
  newSchedule: Partial<DueSchedule> = {};

  constructor(private scheduleService: DueScheduleService) {
    super();
  }

  ngOnInit(): void {
    this.loadSchedules();
  }

  loadSchedules(): void {
    this.loading = true;
    this.error = null;
    this.scheduleService.getDueSchedulesPaginated(this.currentPage, this.pageSize).subscribe({
      next: result => {
        this.schedules = result.content;
        this.filteredSchedules = [...this.schedules];
        this.totalElements = result.totalElements;
        this.totalPages = result.totalPages;
        this.currentPage = result.currentPage;
        this.loading = false;
      },
      error: err => this.handleApiError(err, 'Fehler beim Laden der Fälligkeiten')
    });
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadSchedules();
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadSchedules();
  }

  getPageNumbers(): number[] {
    const start = Math.max(0, this.currentPage - 2);
    const end = Math.min(this.totalPages - 1, this.currentPage + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

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
}
