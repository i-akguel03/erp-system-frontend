import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  InvoiceBatchResult,
  InvoiceBatchPreview,
  InvoiceBatchStatus
} from '../../models/InvoiceBatch';
import { VorgangDTO, VorgangTyp, VorgangStatus, VorgangHelper } from '../../models/Vorgang';
import { Invoice } from '../../models/Invoice';
import { Subject, takeUntil, interval } from 'rxjs';
import { InvoiceBatchService } from '../../services/invoice-batch-service';
import { VorgangService } from '../../services/vorgang-service';
import { NotificationService } from '../../services/notification.service';

interface BatchProgress {
  batchId?: string;
  status: InvoiceBatchStatus;
  progress: number;
  message: string;
  result?: InvoiceBatchResult;
}

@Component({
  selector: 'app-invoice-batch-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-batch-list.html',
  styleUrls: ['./invoice-batch-list.scss']
})
export class InvoiceBatchListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private refreshInterval$ = new Subject<void>();

  // Batch-Steuerung
  loading = false;
  progress: BatchProgress | null = null;
  preview: InvoiceBatchPreview | null = null;
  error: string | null = null;
  billingDate = '';

  // Vorgänge-Liste
  rechnungsVorgaenge: VorgangDTO[] = [];
  filteredVorgaenge: VorgangDTO[] = [];
  vorgaengeLoading = false;
  vorgaengeError = '';
  
  // Filter für Vorgänge
  selectedStatus: VorgangStatus | '' = '';
  searchText = '';
  showOnlyToday = false;
  tageFilter = 7; // Standard: letzte 7 Tage
  
  // Auto-Refresh für laufende Vorgänge
  autoRefresh = true;
  
  // Enums für Template
  VorgangStatus = VorgangStatus;
  VorgangHelper = VorgangHelper;

  constructor(
    private invoiceBatchService: InvoiceBatchService,
    private vorgangService: VorgangService,
    private notification: NotificationService
  ) {
    // Heutiges Datum als Standard setzen
    const today = new Date();
    this.billingDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.loadRechnungsVorgaenge();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.refreshInterval$.next();
    this.refreshInterval$.complete();
  }

  // ===============================================================================================
  // BATCH-OPERATIONEN
  // ===============================================================================================

  /** Heute abrechnen */
  runToday(): void {
    this.startBatchOperation(() => 
      this.invoiceBatchService.runBatchToday(),
      'Lauf für heute gestartet'
    );
  }

  /** Abrechnung für gewähltes Datum starten */
  runForDate(): void {
    if (!this.billingDate) {
      this.error = 'Bitte ein Abrechnungsdatum auswählen.';
      return;
    }
    
    this.startBatchOperation(() => 
      this.invoiceBatchService.runBatch(this.billingDate, false),
      `Lauf für ${this.formatDate(this.billingDate)} gestartet`
    );
  }

  /** Test-Lauf (Dry-Run) */
  runTestMode(): void {
    if (!this.billingDate) {
      this.error = 'Bitte ein Abrechnungsdatum auswählen.';
      return;
    }
    
    this.startBatchOperation(() => 
      this.invoiceBatchService.runBatch(this.billingDate, true),
      `Test-Lauf für ${this.formatDate(this.billingDate)} gestartet`
    );
  }

  /** Vorschau laden */
  loadPreview(): void {
    if (!this.billingDate) {
      this.error = 'Bitte ein Abrechnungsdatum auswählen.';
      return;
    }
    
    this.loading = true;
    this.error = null;
    this.preview = null;
    
    this.invoiceBatchService.getPreview(this.billingDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: preview => { 
          this.preview = preview; 
          this.loading = false; 
        },
        error: err => { 
          this.error = this.extractErrorMessage(err); 
          this.loading = false; 
        }
      });
  }

  private startBatchOperation(operation: () => any, successMessage: string): void {
    this.loading = true;
    this.error = null;
    this.progress = null;
    
    operation()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: InvoiceBatchResult) => {
          this.progress = {
            batchId: result.batchId,
            status: result.status,
            progress: 100,
            message: successMessage,
            result: result
          };
          this.loading = false;
          // Vorgänge-Liste aktualisieren nach Batch-Start
          setTimeout(() => this.loadRechnungsVorgaenge(), 1000);
        },
        error: (err: any) => { 
          this.error = this.extractErrorMessage(err); 
          this.loading = false; 
        }
      });
  }

  // ===============================================================================================
  // VORGÄNGE-MANAGEMENT
  // ===============================================================================================

  /** Rechnungs-Vorgänge laden */
  loadRechnungsVorgaenge(): void {
    this.vorgaengeLoading = true;
    this.vorgaengeError = '';
    
    this.vorgangService.getRecentRechnungslaeufe(this.tageFilter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vorgaenge) => {
          this.rechnungsVorgaenge = vorgaenge;
          this.applyVorgaengeFilter();
          this.vorgaengeLoading = false;
        },
        error: (err) => {
          this.vorgaengeError = this.extractErrorMessage(err);
          this.vorgaengeLoading = false;
        }
      });
  }

  /** Filter auf Vorgänge anwenden */
  applyVorgaengeFilter(): void {
    let filtered = [...this.rechnungsVorgaenge];

    // Status-Filter
    if (this.selectedStatus) {
      filtered = filtered.filter(v => v.status === this.selectedStatus);
    }

    // Suchtext-Filter
    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(v => 
        v.titel?.toLowerCase().includes(search) ||
        v.beschreibung?.toLowerCase().includes(search) ||
        v.vorgangsnummer?.toLowerCase().includes(search)
      );
    }

    // Heute-Filter
    if (this.showOnlyToday) {
      const today = new Date().toDateString();
      filtered = filtered.filter(v => 
        new Date(v.startZeitpunkt).toDateString() === today
      );
    }

    // Sortierung: Neueste zuerst
    filtered.sort((a, b) => 
      new Date(b.startZeitpunkt).getTime() - new Date(a.startZeitpunkt).getTime()
    );

    this.filteredVorgaenge = filtered;
  }

  /** Vorgang abbrechen */
  cancelVorgang(vorgang: VorgangDTO): void {
    if (!VorgangHelper.istLaufend(vorgang.status)) {
      return;
    }

    const grund = prompt('Grund für Abbruch eingeben:');
    if (!grund) return;

    this.vorgangService.vorgangAbbrechen(vorgang.id, grund).subscribe({
      next: () => {
        this.loadRechnungsVorgaenge();
        this.notification.success('Vorgang erfolgreich abgebrochen.');
      },
      error: (err) => {
        this.notification.error('Fehler beim Abbrechen: ' + this.extractErrorMessage(err));
      }
    });
  }

  /** Auto-Refresh starten */
  private startAutoRefresh(): void {
    interval(10000) // Alle 10 Sekunden
      .pipe(takeUntil(this.refreshInterval$))
      .subscribe(() => {
        if (this.autoRefresh && this.hasLaufendeVorgaenge()) {
          this.loadRechnungsVorgaenge();
        }
      });
  }

  /** Prüft ob laufende Vorgänge vorhanden sind */
  private hasLaufendeVorgaenge(): boolean {
    return this.rechnungsVorgaenge.some(v => VorgangHelper.istLaufend(v.status));
  }

  /** Auto-Refresh toggle */
  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    if (this.autoRefresh) {
      this.startAutoRefresh();
    } else {
      this.refreshInterval$.next();
    }
  }

  // ===============================================================================================
  // HELPER-METHODEN
  // ===============================================================================================

  /** Filter zurücksetzen */
  resetVorgaengeFilter(): void {
    this.selectedStatus = '';
    this.searchText = '';
    this.showOnlyToday = false;
    this.applyVorgaengeFilter();
  }

  /** Tage-Filter ändern */
  onTageFilterChange(): void {
    this.loadRechnungsVorgaenge();
  }

  /** Filter-Änderung */
  onFilterChange(): void {
    this.applyVorgaengeFilter();
  }

  /** Datum formatieren */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
  }

  /** Datum/Zeit formatieren */
  formatDateTime(dateTimeString: string): string {
    const date = new Date(dateTimeString);
    return date.toLocaleString('de-DE');
  }

  /** Dauer formatieren */
  formatDauer(vorgang: VorgangDTO): string {
    return VorgangHelper.formatDauer(vorgang.dauerInMs);
  }

  /** Status-CSS-Klasse */
  getStatusClass(status: VorgangStatus): string {
    return VorgangHelper.getStatusClass(status);
  }

  /** Status-Label */
  getStatusLabel(status: VorgangStatus): string {
    return VorgangHelper.getStatusLabel(status);
  }

  /** Badge-Klasse für Status */
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

  /** Fortschritt berechnen */
  getProgress(vorgang: VorgangDTO): number {
    if (!vorgang.anzahlVerarbeitet || vorgang.anzahlVerarbeitet === 0) {
      return VorgangHelper.istLaufend(vorgang.status) ? 50 : 100;
    }
    
    const total = vorgang.anzahlVerarbeitet;
    const processed = (vorgang.anzahlErfolgreich || 0) + (vorgang.anzahlFehler || 0);
    return Math.round((processed / total) * 100);
  }

  /** Anzahl-Text formatieren */
  getAnzahlText(vorgang: VorgangDTO): string {
    if (!vorgang.anzahlVerarbeitet) return '-';
    
    const verarbeitet = vorgang.anzahlVerarbeitet;
    const erfolgreich = vorgang.anzahlErfolgreich || 0;
    const fehler = vorgang.anzahlFehler || 0;
    
    return `${erfolgreich + fehler}/${verarbeitet}`;
  }

  /** Fehler-Message extrahieren */
  private extractErrorMessage(error: any): string {
    return error?.error?.message || error?.message || 'Unbekannter Fehler';
  }

  /** Verfügbare Status für Dropdown */
  getAlleStatus(): VorgangStatus[] {
    return Object.values(VorgangStatus);
  }

  /** Prüft ob Vorgang abbrechbar ist */
  istAbbrechbar(vorgang: VorgangDTO): boolean {
    return VorgangHelper.istLaufend(vorgang.status);
  }

  /** TrackBy für Performance */
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

    this.vorgangService.getRechnungenByVorgang(vorgang.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rechnungen) => {
          this.protokollRechnungen = rechnungen;
          this.protokollLoading = false;
        },
        error: (err) => {
          this.protokollError = this.extractErrorMessage(err);
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
}