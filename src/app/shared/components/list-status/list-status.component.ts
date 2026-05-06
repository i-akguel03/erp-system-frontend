import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-list-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="loading" class="d-flex justify-content-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Wird geladen...</span>
      </div>
    </div>
    <div *ngIf="error" class="alert alert-danger d-flex align-items-center mb-3">
      <i class="fas fa-exclamation-triangle me-2"></i>
      <span class="flex-grow-1">{{ error }}</span>
      <button type="button" class="btn-close ms-2" (click)="dismiss.emit()"></button>
    </div>
  `
})
export class ListStatusComponent {
  @Input() loading = false;
  @Input() error: string | null = null;
  @Output() dismiss = new EventEmitter<void>();
}
