import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Lieferant } from '../../../models/Lieferant';
import { KreditorenService } from '../../../services/kreditoren.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../auth/services/auth';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-lieferanten-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './lieferanten-list.html',
  styleUrls: ['./lieferanten-list.scss']
})
export class LieferantenListComponent implements OnInit {
  lieferanten: Lieferant[] = [];
  filteredLieferanten: Lieferant[] = [];
  loading = false;
  error: string | null = null;
  searchTerm = '';

  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;

  showNewModal = false;
  showEditModal = false;
  saving = false;
  newLieferant: Partial<Lieferant> = { aktiv: true };
  editLieferant: Partial<Lieferant> = {};

  constructor(
    private kreditorenService: KreditorenService,
    private notification: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadLieferanten();
  }

  loadLieferanten(): void {
    this.loading = true;
    this.error = null;
    this.kreditorenService.getLieferantenPaginated(this.currentPage, this.pageSize).subscribe({
      next: result => {
        this.lieferanten = result.content;
        this.totalElements = result.totalElements;
        this.totalPages = result.totalPages;
        this.currentPage = result.currentPage;
        this.applyFilter();
        this.loading = false;
      },
      error: err => {
        this.error = err.error?.message || 'Fehler beim Laden der Lieferanten';
        this.loading = false;
      }
    });
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadLieferanten();
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadLieferanten();
  }

  getPageNumbers(): number[] {
    const start = Math.max(0, this.currentPage - 2);
    const end = Math.min(this.totalPages - 1, this.currentPage + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  applyFilter(): void {
    if (!this.searchTerm) {
      this.filteredLieferanten = this.lieferanten;
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredLieferanten = this.lieferanten.filter(l =>
      l.name.toLowerCase().includes(term) ||
      l.lieferantennummer?.toLowerCase().includes(term) ||
      l.email?.toLowerCase().includes(term)
    );
  }

  openNewModal(): void {
    this.newLieferant = { aktiv: true };
    this.error = null;
    this.showNewModal = true;
  }

  closeNewModal(): void { this.showNewModal = false; }

  openEditModal(l: Lieferant): void {
    this.editLieferant = { ...l };
    this.error = null;
    this.showEditModal = true;
  }

  closeEditModal(): void { this.showEditModal = false; }

  createLieferant(): void {
    if (!this.newLieferant.name) {
      this.error = 'Name ist ein Pflichtfeld.';
      return;
    }
    if (this.saving) return;
    this.saving = true;
    this.kreditorenService.createLieferant(this.newLieferant).subscribe({
      next: created => {
        this.lieferanten.push(created);
        this.applyFilter();
        this.notification.success('Lieferant erfolgreich angelegt.');
        this.saving = false;
        this.closeNewModal();
      },
      error: err => {
        this.error = err.error?.message || 'Fehler beim Anlegen.';
        this.saving = false;
      }
    });
  }

  updateLieferant(): void {
    if (!this.editLieferant.id || !this.editLieferant.name) {
      this.error = 'Name ist ein Pflichtfeld.';
      return;
    }
    if (this.saving) return;
    this.saving = true;
    this.kreditorenService.updateLieferant(this.editLieferant.id, this.editLieferant).subscribe({
      next: updated => {
        const idx = this.lieferanten.findIndex(l => l.id === updated.id);
        if (idx >= 0) this.lieferanten[idx] = updated;
        this.applyFilter();
        this.notification.success('Lieferant erfolgreich aktualisiert.');
        this.saving = false;
        this.closeEditModal();
      },
      error: err => {
        this.error = err.error?.message || 'Fehler beim Aktualisieren.';
        this.saving = false;
      }
    });
  }

  isAdmin(): boolean { return this.authService.isAdmin(); }

  clearError(): void { this.error = null; }
}
