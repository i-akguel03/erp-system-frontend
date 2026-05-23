import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Buchungssatz, BelegTyp } from '../../../models/Buchungssatz';
import { BuchhaltungService } from '../../../services/buchhaltung.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../auth/services/auth';
import { ConfirmationService } from 'primeng/api';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-buchungssatz-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './buchungssatz-list.html',
  styleUrls: ['./buchungssatz-list.scss']
})
export class BuchungssatzListComponent implements OnInit {
  buchungen: Buchungssatz[] = [];
  filteredBuchungen: Buchungssatz[] = [];
  loading = false;
  error: string | null = null;
  searchTerm = '';
  filterStatus: string = '';

  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;

  selectedBuchung: Buchungssatz | null = null;
  showDetailsModal = false;
  storniering = false;

  constructor(
    private buchhaltungService: BuchhaltungService,
    private notification: NotificationService,
    private authService: AuthService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadBuchungen();
  }

  loadBuchungen(): void {
    this.loading = true;
    this.error = null;
    this.buchhaltungService.getBuchungenPaginated(this.currentPage, this.pageSize).subscribe({
      next: result => {
        this.buchungen = result.content;
        this.totalElements = result.totalElements;
        this.totalPages = result.totalPages;
        this.currentPage = result.currentPage;
        this.applyFilter();
        this.loading = false;
      },
      error: err => {
        this.error = err.error?.message || 'Fehler beim Laden der Buchungssätze';
        this.loading = false;
      }
    });
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadBuchungen();
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadBuchungen();
  }

  getPageNumbers(): number[] {
    const start = Math.max(0, this.currentPage - 2);
    const end = Math.min(this.totalPages - 1, this.currentPage + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  applyFilter(): void {
    let result = this.buchungen;
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(b =>
        b.buchungsnummer?.toLowerCase().includes(term) ||
        b.beschreibung?.toLowerCase().includes(term) ||
        b.belegReferenzNummer?.toLowerCase().includes(term)
      );
    }
    if (this.filterStatus) {
      result = result.filter(b => b.status === this.filterStatus);
    }
    this.filteredBuchungen = result;
  }

  openDetails(b: Buchungssatz): void {
    this.selectedBuchung = b;
    this.showDetailsModal = true;
  }

  closeDetails(): void {
    this.showDetailsModal = false;
    this.selectedBuchung = null;
  }

  stornieren(b: Buchungssatz): void {
    if (!b.id || this.storniering) return;
    this.confirmationService.confirm({
      message: `Buchungssatz ${b.buchungsnummer} wirklich stornieren?`,
      header: 'Buchungssatz stornieren',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Stornieren',
      rejectLabel: 'Abbrechen',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.storniering = true;
        this.buchhaltungService.stornieren(b.id!).subscribe({
          next: stornoSatz => {
            this.buchungen = this.buchungen.map(x => x.id === b.id ? { ...x, status: 'STORNIERT' } : x);
            this.buchungen.push(stornoSatz);
            this.applyFilter();
            this.notification.success(`Storno-Buchung ${stornoSatz.buchungsnummer} erstellt.`);
            this.storniering = false;
            if (this.showDetailsModal) this.closeDetails();
          },
          error: err => {
            this.notification.error(err.error?.message || 'Fehler beim Stornieren.');
            this.storniering = false;
          }
        });
      }
    });
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  getBelegTypLabel(typ: BelegTyp | undefined): string {
    const labels: Record<BelegTyp, string> = {
      RECHNUNG: 'Rechnung', ZAHLUNG_EINGANG: 'Zahlungseingang',
      GUTSCHRIFT: 'Gutschrift', EINGANGSRECHNUNG: 'Eingangsrechnung',
      ZAHLUNG_AUSGANG: 'Zahlungsausgang', MANUELLE_BUCHUNG: 'Manuelle Buchung'
    };
    return typ ? (labels[typ] || typ) : '-';
  }

  getStatusBadge(status: string | undefined): string {
    const badges: Record<string, string> = {
      ENTWURF: 'bg-secondary', GEBUCHT: 'bg-success', STORNIERT: 'bg-danger'
    };
    return badges[status || ''] || 'bg-light text-dark';
  }

  getStatusLabel(status: string | undefined): string {
    const labels: Record<string, string> = {
      ENTWURF: 'Entwurf', GEBUCHT: 'Gebucht', STORNIERT: 'Storniert'
    };
    return labels[status || ''] || (status || '-');
  }

  canStorno(b: Buchungssatz): boolean {
    return b.status === 'GEBUCHT' && !b.stornoVonId;
  }

  clearError(): void { this.error = null; }
}
