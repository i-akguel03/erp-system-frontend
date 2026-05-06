import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-list-toolbar',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="position-sticky bg-white shadow-sm border-bottom px-3 px-md-4 py-3" style="top: 0; z-index: 10;">
      <div class="d-flex gap-2 align-items-center">
        <div class="input-group">
          <span class="input-group-text bg-transparent border-end-0 text-muted">
            <i class="fas fa-search"></i>
          </span>
          <input type="text" class="form-control border-start-0 ps-0"
                 [placeholder]="placeholder"
                 [(ngModel)]="searchTerm"
                 (ngModelChange)="onSearch($event)">
        </div>
        <button class="btn btn-outline-secondary flex-shrink-0" (click)="refresh.emit()" title="Alle anzeigen">
          <i class="fas fa-sync-alt"></i>
        </button>
        <button class="btn btn-primary flex-shrink-0" (click)="newClick.emit()">
          <i class="fas fa-plus me-1"></i><span class="d-none d-sm-inline">{{ newLabel }}</span>
        </button>
      </div>
    </div>
  `
})
export class ListToolbarComponent {
  @Input() placeholder = 'Suchen...';
  @Input() newLabel = 'Neu';
  @Input() searchTerm = '';
  @Output() searchTermChange = new EventEmitter<string>();
  @Output() search = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();
  @Output() newClick = new EventEmitter<void>();

  onSearch(value: string): void {
    this.searchTermChange.emit(value);
    this.search.emit();
  }
}
