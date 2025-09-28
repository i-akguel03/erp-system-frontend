import { Component, OnInit } from '@angular/core';
import { VorgangDTO, VorgangStatus, VorgangTyp, VorgangHelper, VorgangStatistik } from '../../models/Vorgang';
import { VorgangService } from '../../services/vorgang-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vorgaenge-list',
  templateUrl: './vorgang-list.html',
  imports: [CommonModule, FormsModule],
})
export class VorgaengeListComponent implements OnInit {
  vorgaenge: VorgangDTO[] = [];
  filteredVorgaenge: VorgangDTO[] = [];
  loading = false;
  errorMsg = '';
  
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

  constructor(private vorgangService: VorgangService) {}

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
    
    this.vorgangService.getAllVorgaengeOhnePaging().subscribe({
      next: (data) => {
        console.log('Geladene Vorgänge:', data);
        this.vorgaenge = data;
        this.applyFiltersAndSort();
        
        // Nach dem Laden der Vorgänge Statistiken laden/berechnen
        this.loadStatistiken();
        
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = 'Fehler beim Laden der Vorgänge';
        console.error('Fehler beim Laden der Vorgänge:', err);
        this.loading = false;
      }
    });
  }

  /**
   * Statistiken laden
   */
  loadStatistiken(): void {
    this.vorgangService.getVorgangStatistiken().subscribe({
      next: (stats) => {
        this.statistiken = stats;
        console.log('Statistiken vom Server:', stats);
      },
      error: (err) => {
        console.error('Fehler beim Laden der Statistiken:', err);
        // Fallback: Statistiken aus den geladenen Vorgängen berechnen
        if (this.vorgaenge.length > 0) {
          this.statistiken = this.berechneStatistiken(this.vorgaenge);
          console.log('Fallback-Statistiken berechnet:', this.statistiken);
        }
      }
    });
  }
  berechneStatistiken(vorgaenge: VorgangDTO[]): VorgangStatistik | null {
    throw new Error('Method not implemented.');
  }

  /**
   * Filter und Sortierung anwenden
   */
  applyFiltersAndSort(): void {
    console.log('Anwenden Filter auf', this.vorgaenge.length, 'Vorgänge');
    
    // Filter anwenden
    this.filteredVorgaenge = this.vorgangService.filterVorgaenge(this.vorgaenge, {
      typ: this.selectedTyp || undefined,
      status: this.selectedStatus || undefined,
      automatisch: this.selectedAutomatisch ?? undefined,
      suchtext: this.searchText || undefined
    });

    console.log('Nach Filter:', this.filteredVorgaenge.length, 'Vorgänge');

    // Sortierung anwenden
    this.filteredVorgaenge = this.vorgangService.sortVorgaenge(
      this.filteredVorgaenge,
      this.sortBy,
      this.sortDirection
    );
    
    console.log('Finale gefilterte Vorgänge:', this.filteredVorgaenge);
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
      next: (message) => {
        console.log(message);
        this.loadVorgaenge(); // Neu laden
      },
      error: (err) => {
        console.error('Fehler beim Abbrechen:', err);
        alert('Fehler beim Abbrechen des Vorgangs');
      }
    });
  }

  /**
   * Hängengebliebene Vorgänge korrigieren
   */
  korrigiereHaengengebliebene(): void {
    const stundenSchwellwert = 24;
    
    this.vorgangService.korrigiereHaengengebliebene(stundenSchwellwert).subscribe({
      next: (message) => {
        console.log(message);
        alert(message);
        this.loadVorgaenge(); // Neu laden
      },
      error: (err) => {
        console.error('Fehler beim Korrigieren:', err);
        alert('Fehler beim Korrigieren hängengebliebener Vorgänge');
      }
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
}