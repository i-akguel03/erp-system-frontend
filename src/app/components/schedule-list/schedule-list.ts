import { Component, OnInit } from '@angular/core';
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
        console.log(data)
        this.schedules = data;
        this.filteredSchedules = [...this.schedules];
        this.loading = false;
      },
      error: err => this.handleApiError(err, 'Fehler beim Laden der Fälligkeiten')
    });
  }

  filterSchedules(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredSchedules = this.schedules.filter(s =>
      s.dueNumber.toLowerCase().includes(term) ||
      s.subscriptionId.toLowerCase().includes(term) ||
      s.status.toLowerCase().includes(term)
    );
  }

  // --- CRUD-like Actions ---
  markAsPaid(schedule: DueSchedule): void {
    if (!schedule.id) return;
    this.scheduleService.markAsPaid(schedule.id).subscribe({
      next: updated => {
        this.updateLocalSchedule(updated);
      },
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
