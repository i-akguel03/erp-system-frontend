import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogService } from '../../services/audit-log.service';
import { AuditLog, AuditAction, AuditPage } from '../../models/AuditLog';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-log.html'
})
export class AuditLogComponent implements OnInit {
  logs: AuditLog[] = [];
  loading = false;
  error = '';

  // Pagination
  page = 0;
  pageSize = 50;
  totalElements = 0;
  totalPages = 0;

  // Filter
  filterAction: AuditAction | '' = '';
  filterEntity = '';
  filterUser = '';
  filterFrom = '';
  filterTo = '';
  activeFilter: 'none' | 'user' | 'action' | 'entity' | 'range' = 'none';

  // Detail modal
  selectedLog: AuditLog | null = null;

  readonly actions: AuditAction[] = ['CREATE', 'UPDATE', 'DELETE'];

  constructor(private auditLogService: AuditLogService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';

    const obs$ = this.resolveQuery();
    obs$.subscribe({
      next: (result) => {
        if (Array.isArray(result)) {
          this.logs = result;
          this.totalElements = result.length;
          this.totalPages = 1;
        } else {
          const page = result as AuditPage;
          this.logs = page.content;
          this.totalElements = page.totalElements;
          this.totalPages = page.totalPages;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Fehler beim Laden der Audit-Logs';
        this.loading = false;
      }
    });
  }

  private resolveQuery(): Observable<AuditPage | AuditLog[]> {
    switch (this.activeFilter) {
      case 'user':
        return this.auditLogService.getByUser(this.filterUser);
      case 'action':
        return this.auditLogService.getByAction(this.filterAction as AuditAction);
      case 'entity':
        return this.auditLogService.getByEntityType(this.filterEntity);
      case 'range':
        return this.auditLogService.getByDateRange(
          this.filterFrom + ':00',
          this.filterTo + ':00'
        );
      default:
        return this.auditLogService.getAll(this.page, this.pageSize);
    }
  }

  applyFilter(): void {
    this.page = 0;
    if (this.filterUser.trim()) this.activeFilter = 'user';
    else if (this.filterAction) this.activeFilter = 'action';
    else if (this.filterEntity.trim()) this.activeFilter = 'entity';
    else if (this.filterFrom && this.filterTo) this.activeFilter = 'range';
    else this.activeFilter = 'none';
    this.load();
  }

  resetFilter(): void {
    this.filterAction = '';
    this.filterEntity = '';
    this.filterUser = '';
    this.filterFrom = '';
    this.filterTo = '';
    this.activeFilter = 'none';
    this.page = 0;
    this.load();
  }

  goToPage(p: number): void {
    if (p < 0 || p >= this.totalPages) return;
    this.page = p;
    this.load();
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  openDetail(log: AuditLog): void {
    this.selectedLog = log;
  }

  closeDetail(): void {
    this.selectedLog = null;
  }

  formatJson(raw?: string): string {
    if (!raw) return '–';
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }

  actionBadgeClass(action: AuditAction): string {
    switch (action) {
      case 'CREATE': return 'bg-success text-white';
      case 'UPDATE': return 'bg-warning text-dark';
      case 'DELETE': return 'bg-danger text-white';
    }
  }

  actionLabel(action: AuditAction): string {
    switch (action) {
      case 'CREATE': return 'Erstellt';
      case 'UPDATE': return 'Geändert';
      case 'DELETE': return 'Gelöscht';
    }
  }

  get countCreate(): number { return this.logs.filter(l => l.action === 'CREATE').length; }
  get countUpdate(): number { return this.logs.filter(l => l.action === 'UPDATE').length; }
  get countDelete(): number { return this.logs.filter(l => l.action === 'DELETE').length; }

  trackById(_i: number, log: AuditLog): string { return log.id; }
}
