import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DueScheduleService } from '../../services/due-schedule-service';
import { DueSchedule, PaymentDto } from '../../models/DueSchedule';

@Component({
  selector: 'app-due-schedule-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schedule-list.html',
  styleUrls: ['./schedule-list.scss'],
})
export class DueScheduleListComponent implements OnInit {
  schedules: DueSchedule[] = [];
  filteredSchedules: DueSchedule[] = [];
  loading = false;
  error: string | null = null;
  searchTerm: string = '';

  newPaymentAmount: number = 0;
  selectedSchedule?: DueSchedule;

  // Modal für neue Fälligkeit
  showNewScheduleModal = false;
  newSchedule: Partial<DueSchedule> = {};

  constructor(private scheduleService: DueScheduleService) {}

  ngOnInit(): void {
    this.loadSchedules();
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

  // --- CRUD-like Actions ---
  markAsPaid(schedule: DueSchedule): void {
    if (!schedule.id) return;
    this.scheduleService.markAsPaid(schedule.id).subscribe({
      next: updated => this.updateLocalSchedule(updated),
      error: err => this.handleApiError(err, 'Fehler beim Markieren als bezahlt')
    });
  }

  cancelSchedule(schedule: DueSchedule): void {
    if (!schedule.id || !confirm('Möchten Sie diese Fälligkeit wirklich stornieren?')) return;
    this.scheduleService.cancelDueSchedule(schedule.id).subscribe({
      next: updated => this.updateLocalSchedule(updated),
      error: err => this.handleApiError(err, 'Fehler beim Stornieren der Fälligkeit')
    });
  }

  sendReminder(schedule: DueSchedule): void {
    if (!schedule.id) return;
    this.scheduleService.sendReminder(schedule.id).subscribe({
      next: updated => this.updateLocalSchedule(updated),
      error: err => this.handleApiError(err, 'Fehler beim Versenden der Mahnung')
    });
  }

  recordPayment(schedule: DueSchedule, amount: number): void {
    if (!schedule.id) return;
    const payment: PaymentDto = { amount, paymentDate: new Date() };
    this.scheduleService.recordPayment(schedule.id, payment).subscribe({
      next: updated => this.updateLocalSchedule(updated),
      error: err => this.handleApiError(err, 'Fehler beim Verbuchen der Zahlung')
    });
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
    if (!this.newSchedule.dueDate || !this.newSchedule.amount || !this.newSchedule.subscriptionId) return;
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
  private updateLocalSchedule(updated: DueSchedule): void {
    const index = this.schedules.findIndex(s => s.id === updated.id);
    if (index >= 0) this.schedules[index] = updated;
    this.filteredSchedules = [...this.schedules];
  }

  private handleApiError(err: any, defaultMessage: string): void {
    console.error('API Error:', err);
    this.loading = false;
    this.error = err.error?.message || defaultMessage;
  }
}
