import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Eingangsrechnung, EingangsrechnungStatus, EingangsrechnungErfassenRequest, ZahlungRequest } from '../../../models/Eingangsrechnung';
import { Lieferant } from '../../../models/Lieferant';
import { Konto } from '../../../models/Konto';
import { KreditorenService } from '../../../services/kreditoren.service';
import { KontenplanService } from '../../../services/kontenplan.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../auth/services/auth';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-eingangsrechnung-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './eingangsrechnung-list.html',
  styleUrls: ['./eingangsrechnung-list.scss']
})
export class EingangsrechnungListComponent implements OnInit {
  rechnungen: Eingangsrechnung[] = [];
  filteredRechnungen: Eingangsrechnung[] = [];
  loading = false;
  error: string | null = null;
  searchTerm = '';
  filterStatus: EingangsrechnungStatus | '' = '';
  showNurUeberfaellig = false;

  lieferanten: Lieferant[] = [];
  aufwandskonten: Konto[] = [];

  // Erfassen Modal
  showNewModal = false;
  saving = false;
  newRequest: EingangsrechnungErfassenRequest = this.emptyRequest();

  // Zahlung Modal
  showZahlungModal = false;
  zahlungRechnung: Eingangsrechnung | null = null;
  zahlungRequest: ZahlungRequest = { gezahltAm: '', zahlungsreferenz: '' };

  constructor(
    private kreditorenService: KreditorenService,
    private kontenplanService: KontenplanService,
    private notification: NotificationService,
    private authService: AuthService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadRechnungen();
    this.loadLieferanten();
    this.loadAufwandskonten();
  }

  loadRechnungen(): void {
    this.loading = true;
    this.error = null;
    const obs = this.showNurUeberfaellig
      ? this.kreditorenService.getUeberfaellige()
      : this.kreditorenService.getAllEingangsrechnungen();

    obs.subscribe({
      next: data => {
        this.rechnungen = data;
        this.applyFilter();
        this.loading = false;
      },
      error: err => {
        this.error = err.error?.message || 'Fehler beim Laden der Eingangsrechnungen';
        this.loading = false;
      }
    });
  }

  toggleUeberfaellig(): void {
    this.showNurUeberfaellig = !this.showNurUeberfaellig;
    this.loadRechnungen();
  }

  loadLieferanten(): void {
    this.kreditorenService.getAllLieferanten().subscribe({
      next: data => { this.lieferanten = data.filter(l => l.aktiv !== false); },
      error: () => this.notification.warn('Lieferanten konnten nicht geladen werden.')
    });
  }

  loadAufwandskonten(): void {
    this.kontenplanService.getAll().subscribe({
      next: data => { this.aufwandskonten = data.filter(k => k.kontoTyp === 'AUFWAND'); },
      error: () => this.notification.warn('Aufwandskonten konnten nicht geladen werden.')
    });
  }

  applyFilter(): void {
    let result = this.rechnungen;
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(r =>
        r.eingangsrechnungsnummer?.toLowerCase().includes(term) ||
        r.lieferantName?.toLowerCase().includes(term) ||
        r.lieferantenRechnungsnummer?.toLowerCase().includes(term)
      );
    }
    if (this.filterStatus) {
      result = result.filter(r => r.status === this.filterStatus);
    }
    this.filteredRechnungen = result;
  }

  // --- Erfassen ---
  openNewModal(): void {
    this.newRequest = this.emptyRequest();
    this.error = null;
    this.showNewModal = true;
  }

  closeNewModal(): void { this.showNewModal = false; }

  berechnetBrutto(): number {
    const netto = this.newRequest.nettobetrag || 0;
    const satz = this.newRequest.steuersatz || 0;
    return netto * (1 + satz / 100);
  }

  erfassen(): void {
    if (!this.newRequest.lieferantId || !this.newRequest.eingangsDatum ||
        !this.newRequest.rechnungsDatum || !this.newRequest.faelligDatum ||
        !this.newRequest.nettobetrag || !this.newRequest.aufwandskontoNr) {
      this.error = 'Bitte alle Pflichtfelder ausfüllen.';
      return;
    }
    if (this.saving) return;
    this.saving = true;
    this.kreditorenService.erfassen(this.newRequest).subscribe({
      next: created => {
        this.rechnungen.unshift(created);
        this.applyFilter();
        this.notification.success('Eingangsrechnung erfasst.');
        this.saving = false;
        this.closeNewModal();
      },
      error: err => {
        this.error = err.error?.message || 'Fehler beim Erfassen.';
        this.saving = false;
      }
    });
  }

  // --- Freigeben ---
  freigeben(r: Eingangsrechnung): void {
    if (!r.id) return;
    this.confirmationService.confirm({
      message: `Eingangsrechnung ${r.eingangsrechnungsnummer} freigeben und GL-Buchung erstellen?`,
      header: 'Eingangsrechnung freigeben',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Freigeben',
      rejectLabel: 'Abbrechen',
      accept: () => {
        this.kreditorenService.freigeben(r.id!).subscribe({
          next: updated => {
            this.updateLocal(updated);
            this.notification.success('Rechnung freigegeben, GL-Buchung erstellt.');
          },
          error: err => this.notification.error(err.error?.message || 'Fehler beim Freigeben.')
        });
      }
    });
  }

  // --- Zahlung ---
  openZahlungModal(r: Eingangsrechnung): void {
    this.zahlungRechnung = r;
    this.zahlungRequest = { gezahltAm: new Date().toISOString().split('T')[0], zahlungsreferenz: '' };
    this.showZahlungModal = true;
  }

  closeZahlungModal(): void {
    this.showZahlungModal = false;
    this.zahlungRechnung = null;
  }

  bezahlen(): void {
    if (!this.zahlungRechnung?.id || !this.zahlungRequest.gezahltAm) return;
    if (this.saving) return;
    this.saving = true;
    this.kreditorenService.bezahlen(this.zahlungRechnung.id, this.zahlungRequest).subscribe({
      next: updated => {
        this.updateLocal(updated);
        this.notification.success('Zahlung verbucht, GL-Buchung erstellt.');
        this.saving = false;
        this.closeZahlungModal();
      },
      error: err => {
        this.notification.error(err.error?.message || 'Fehler beim Bezahlen.');
        this.saving = false;
      }
    });
  }

  private updateLocal(updated: Eingangsrechnung): void {
    const idx = this.rechnungen.findIndex(r => r.id === updated.id);
    if (idx >= 0) {
      this.rechnungen[idx] = updated;
      this.applyFilter();
    }
  }

  private emptyRequest(): EingangsrechnungErfassenRequest {
    const today = new Date().toISOString().split('T')[0];
    return {
      lieferantId: '', lieferantenRechnungsnummer: '',
      eingangsDatum: today, rechnungsDatum: today, faelligDatum: today,
      nettobetrag: 0, steuersatz: 19, aufwandskontoNr: 0, notizen: ''
    };
  }

  isAdmin(): boolean { return this.authService.isAdmin(); }

  canFreigeben(r: Eingangsrechnung): boolean {
    return r.status === 'ERFASST' || r.status === 'GEPRUEFT';
  }

  canBezahlen(r: Eingangsrechnung): boolean {
    return r.status === 'FREIGEGEBEN';
  }

  getStatusBadge(status: EingangsrechnungStatus | undefined): string {
    const badges: Record<EingangsrechnungStatus, string> = {
      ERFASST: 'bg-secondary', GEPRUEFT: 'bg-info text-dark',
      FREIGEGEBEN: 'bg-warning text-dark', BEZAHLT: 'bg-success', STORNIERT: 'bg-danger'
    };
    return badges[status || 'ERFASST'] || 'bg-light text-dark';
  }

  getStatusLabel(status: EingangsrechnungStatus | undefined): string {
    const labels: Record<EingangsrechnungStatus, string> = {
      ERFASST: 'Erfasst', GEPRUEFT: 'Geprüft',
      FREIGEGEBEN: 'Freigegeben', BEZAHLT: 'Bezahlt', STORNIERT: 'Storniert'
    };
    return labels[status || 'ERFASST'] || (status || '-');
  }

  clearError(): void { this.error = null; }
}
