import { Component, OnInit } from '@angular/core';
import { VorgangDTO, VorgangStatus, VorgangTyp, VorgangHelper, VorgangStatistik } from '../../models/Vorgang';
import { Invoice } from '../../models/Invoice';
import { Contract } from '../../models/Contract';
import { VorgangService } from '../../services/vorgang-service';
import { NotificationService } from '../../services/notification.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-vorgaenge-list',
  templateUrl: './vorgang-list.html',
  styleUrls: ['./vorgang-list.scss'],
  imports: [CommonModule, FormsModule, PaginationComponent],
})
export class VorgaengeListComponent implements OnInit {
  vorgaenge: VorgangDTO[] = [];
  filteredVorgaenge: VorgangDTO[] = [];
  loading = false;
  errorMsg = '';

  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;
  
  // Filter-Eigenschaften
  selectedTyp: VorgangTyp | '' = '';
  selectedStatus: VorgangStatus | '' = '';
  selectedAutomatisch: boolean | null = null;
  searchText = '';
  
  // Sortierung
  sortBy = 'startZeitpunkt';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // Statistiken
  statistiken: VorgangStatistik | null = null;
  
  // Template-Statistiken (berechnet)
  get gesamtAnzahl(): number {
    return this.vorgaenge.length;
  }
  
  get laufendeAnzahl(): number {
    return this.vorgaenge.filter(v => 
      v.status === VorgangStatus.LAUFEND || v.status === VorgangStatus.GESTARTET
    ).length;
  }
  
  get erfolgreicheAnzahl(): number {
    return this.vorgaenge.filter(v => v.status === VorgangStatus.ERFOLGREICH).length;
  }
  
  get fehlerAnzahl(): number {
    return this.vorgaenge.filter(v => v.status === VorgangStatus.FEHLER).length;
  }
  
  get abgebrochenesAnzahl(): number {
    return this.vorgaenge.filter(v => v.status === VorgangStatus.ABGEBROCHEN).length;
  }
  
  get erfolgsquoteBerechnet(): number {
    if (this.vorgaenge.length === 0) return 0;
    return (this.erfolgreicheAnzahl / this.vorgaenge.length) * 100;
  }
  
  // Enums für Template
  VorgangStatus = VorgangStatus;
  VorgangTyp = VorgangTyp;
  VorgangHelper = VorgangHelper;

  constructor(
    private vorgangService: VorgangService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadVorgaenge();
    // Statistiken werden nach dem Laden der Vorgänge geladen/berechnet
  }

  /**
   * Alle Vorgänge laden (ohne Paging)
   */
  loadVorgaenge(): void {
    this.loading = true;
    this.errorMsg = '';

    this.vorgangService.getVorgaengePaginated(this.currentPage, this.pageSize).subscribe({
      next: result => {
        this.vorgaenge = result.content;
        this.totalElements = result.totalElements;
        this.totalPages = result.totalPages;
        this.currentPage = result.currentPage;
        this.applyFiltersAndSort();
        this.loadStatistiken();
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Fehler beim Laden der Vorgänge';
        this.loading = false;
      }
    });
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadVorgaenge();
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadVorgaenge();
  }

  getPageNumbers(): number[] {
    const start = Math.max(0, this.currentPage - 2);
    const end = Math.min(this.totalPages - 1, this.currentPage + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  /**
   * Statistiken laden
   */
  loadStatistiken(): void {
    this.vorgangService.getVorgangStatistiken().subscribe({
      next: (stats) => {
        this.statistiken = stats;
      },
      error: () => {
        if (this.vorgaenge.length > 0) {
          this.statistiken = this.berechneStatistiken(this.vorgaenge);
        }
      }
    });
  }
  berechneStatistiken(vorgaenge: VorgangDTO[]): VorgangStatistik {
    return this.vorgangService.berechneStatistiken(vorgaenge);
  }

  /**
   * Filter und Sortierung anwenden
   */
  applyFiltersAndSort(): void {
    this.filteredVorgaenge = this.vorgangService.filterVorgaenge(this.vorgaenge, {
      typ: this.selectedTyp || undefined,
      status: this.selectedStatus || undefined,
      automatisch: this.selectedAutomatisch ?? undefined,
      suchtext: this.searchText || undefined
    });

    this.filteredVorgaenge = this.vorgangService.sortVorgaenge(
      this.filteredVorgaenge,
      this.sortBy,
      this.sortDirection
    );
  }

  /**
   * Filter zurücksetzen
   */
  resetFilters(): void {
    this.selectedTyp = '';
    this.selectedStatus = '';
    this.selectedAutomatisch = null;
    this.searchText = '';
    this.applyFiltersAndSort();
  }

  /**
   * Sortierung ändern
   */
  sort(field: string): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'desc';
    }
    this.applyFiltersAndSort();
  }

  /**
   * Badge-Klasse für Status
   */
  getBadgeClass(status: VorgangStatus): string {
    switch (status) {
      case VorgangStatus.LAUFEND:
      case VorgangStatus.GESTARTET:
        return 'bg-primary text-white';
      case VorgangStatus.ERFOLGREICH:
        return 'bg-success text-white';
      case VorgangStatus.FEHLER:
        return 'bg-danger text-white';
      case VorgangStatus.ABGEBROCHEN:
        return 'bg-warning text-dark';
      default:
        return 'bg-secondary text-white';
    }
  }

  /**
   * Icon für Vorgang-Typ
   */
  getTypIcon(typ: VorgangTyp): string {
    switch (typ) {
      case VorgangTyp.RECHNUNGSLAUF:
        return '📊';
      case VorgangTyp.VERLAENGERUNGSLAUF:
      case VorgangTyp.VERTRAGSERNEUERUNG:
        return '🔄';
      case VorgangTyp.DATENIMPORT:
        return '📁';
      case VorgangTyp.STATUS_AENDERUNG:
        return '🔄';
      case VorgangTyp.ZAHLUNGSEINGANG:
        return '💰';
      case VorgangTyp.BULK_OPERATION:
        return '⚡';
      case VorgangTyp.SYSTEM_WARTUNG:
        return '🔧';
      case VorgangTyp.REPORT_GENERATION:
        return '📋';
      default:
        return '📄';
    }
  }

  /**
   * Vorgang abbrechen
   */
  abbrechen(vorgang: VorgangDTO): void {
    if (!VorgangHelper.istLaufend(vorgang.status)) {
      return;
    }

    const grund = prompt('Grund für Abbruch eingeben:');
    if (!grund) return;

    this.vorgangService.vorgangAbbrechen(vorgang.id, grund).subscribe({
      next: () => this.loadVorgaenge(),
      error: () => this.notification.error('Fehler beim Abbrechen des Vorgangs')
    });
  }

  /**
   * Hängengebliebene Vorgänge korrigieren
   */
  korrigiereHaengengebliebene(): void {
    const stundenSchwellwert = 24;
    
    this.vorgangService.korrigiereHaengengebliebene(stundenSchwellwert).subscribe({
      next: (message) => {
        this.notification.success(message);
        this.loadVorgaenge();
      },
      error: () => this.notification.error('Fehler beim Korrigieren hängengebliebener Vorgänge')
    });
  }

  /**
   * Fortschrittsbalken-Wert berechnen
   */
  getProgress(vorgang: VorgangDTO): number {
    if (!vorgang.anzahlVerarbeitet || vorgang.anzahlVerarbeitet === 0) {
      return VorgangHelper.istLaufend(vorgang.status) ? 50 : 100;
    }
    
    const total = vorgang.anzahlVerarbeitet;
    const processed = (vorgang.anzahlErfolgreich || 0) + (vorgang.anzahlFehler || 0);
    return Math.round((processed / total) * 100);
  }

  /**
   * Formatierte Anzahl-Anzeige
   */
  getAnzahlText(vorgang: VorgangDTO): string {
    if (!vorgang.anzahlVerarbeitet) return '-';
    
    const verarbeitet = vorgang.anzahlVerarbeitet;
    const erfolgreich = vorgang.anzahlErfolgreich || 0;
    const fehler = vorgang.anzahlFehler || 0;
    
    return `${erfolgreich + fehler}/${verarbeitet}`;
  }

  /**
   * Formatierte Dauer
   */
  formatDauer(vorgang: VorgangDTO): string {
    return VorgangHelper.formatDauer(vorgang.dauerInMs);
  }

  /**
   * Formatierte Erfolgsquote
   */
  formatErfolgsquote(vorgang: VorgangDTO): string {
    if (!vorgang || vorgang.erfolgsquote === null || vorgang.erfolgsquote === undefined) {
      return '-';
    }
    return VorgangHelper.formatErfolgsquote(vorgang.erfolgsquote);
  }

  /**
   * Status-Label
   */
  getStatusLabel(status: VorgangStatus): string {
    return VorgangHelper.getStatusLabel(status);
  }

  /**
   * Typ-Label
   */
  getTypLabel(typ: VorgangTyp): string {
    return VorgangHelper.getTypLabel(typ);
  }

  /**
   * Prüft ob Vorgang abbrechbar ist
   */
  istAbbrechbar(vorgang: VorgangDTO): boolean {
    return VorgangHelper.istLaufend(vorgang.status);
  }

  /**
   * Formatiert Datum/Zeit
   */
  formatDateTime(dateTimeString: string): string {
    const date = new Date(dateTimeString);
    return date.toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Alle verfügbaren Typen für Dropdown
   */
  getAlleTypen(): VorgangTyp[] {
    return Object.values(VorgangTyp);
  }

  /**
   * Alle verfügbaren Status für Dropdown
   */
  getAlleStatus(): VorgangStatus[] {
    return Object.values(VorgangStatus);
  }

  /**
   * Aktualisiert die Ansicht wenn Filter geändert werden
   */
  onFilterChange(): void {
    this.applyFiltersAndSort();
  }

  /**
   * Gibt die CSS-Klasse für Sortier-Pfeil zurück
   */
  getSortIcon(field: string): string {
    if (this.sortBy !== field) return '';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  /**
   * TrackBy-Funktion für bessere Performance
   */
  trackByVorgangId(index: number, vorgang: VorgangDTO): string {
    return vorgang?.id || index.toString();
  }

  // ===============================================================================================
  // PROTOKOLL-MODAL
  // ===============================================================================================

  protokollVisible = false;
  protokollVorgang: VorgangDTO | null = null;
  protokollRechnungen: Invoice[] = [];
  protokollLoading = false;
  protokollError = '';

  showProtokoll(vorgang: VorgangDTO): void {
    this.protokollVorgang = vorgang;
    this.protokollRechnungen = [];
    this.protokollError = '';
    this.protokollLoading = true;
    this.protokollVisible = true;

    this.vorgangService.getRechnungenByVorgang(vorgang.id).subscribe({
      next: (rechnungen) => {
        this.protokollRechnungen = rechnungen;
        this.protokollLoading = false;
      },
      error: (err) => {
        this.protokollError = err?.error?.message || err?.message || 'Fehler beim Laden der Rechnungen';
        this.protokollLoading = false;
      }
    });
  }

  closeProtokoll(): void {
    this.protokollVisible = false;
    this.protokollVorgang = null;
    this.protokollRechnungen = [];
    this.protokollError = '';
  }

  getInvoiceStatusClass(status?: string): string {
    switch (status) {
      case 'ACTIVE': return 'bg-success text-white';
      case 'SENT': return 'bg-primary text-white';
      case 'DRAFT': return 'bg-warning text-dark';
      case 'CANCELLED': return 'bg-danger text-white';
      default: return 'bg-secondary text-white';
    }
  }

  getProtokollTotal(field: 'subtotal' | 'taxAmount' | 'totalAmount'): number {
    return this.protokollRechnungen.reduce((sum, inv) => sum + (inv[field] ?? 0), 0);
  }

  // ===============================================================================================
  // VERTRÄGE-MODAL (Verlängerungslauf)
  // ===============================================================================================

  vertraegeVisible = false;
  vertraegeVorgang: VorgangDTO | null = null;
  vertraege: Contract[] = [];
  vertraegeLoading = false;
  vertraegeError = '';

  showVertraege(vorgang: VorgangDTO): void {
    this.vertraegeVorgang = vorgang;
    this.vertraege = [];
    this.vertraegeError = '';
    this.vertraegeLoading = true;
    this.vertraegeVisible = true;

    this.vorgangService.getVertraegeByVorgang(vorgang.id).subscribe({
      next: (vertraege) => {
        this.vertraege = vertraege;
        this.vertraegeLoading = false;
      },
      error: (err) => {
        this.vertraegeError = err?.error?.message || err?.message || 'Fehler beim Laden der Verträge';
        this.vertraegeLoading = false;
      }
    });
  }

  closeVertraege(): void {
    this.vertraegeVisible = false;
    this.vertraegeVorgang = null;
    this.vertraege = [];
    this.vertraegeError = '';
  }

  getContractStatusClass(status?: string): string {
    switch (status) {
      case 'ACTIVE': return 'bg-success text-white';
      case 'DRAFT': return 'bg-warning text-dark';
      case 'SUSPENDED': return 'bg-secondary text-white';
      case 'TERMINATED': return 'bg-dark text-white';
      case 'EXPIRED': return 'bg-danger text-white';
      default: return 'bg-light text-dark';
    }
  }
}