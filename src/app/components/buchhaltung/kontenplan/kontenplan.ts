import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Konto, KontoTyp } from '../../../models/Konto';
import { KontenplanService } from '../../../services/kontenplan.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../auth/services/auth';

@Component({
  selector: 'app-kontenplan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kontenplan.html',
  styleUrls: ['./kontenplan.scss']
})
export class KontenplanComponent implements OnInit {
  konten: Konto[] = [];
  filteredKonten: Konto[] = [];
  loading = false;
  initLoading = false;
  error: string | null = null;
  searchTerm = '';
  filterTyp: KontoTyp | '' = '';

  showNewModal = false;
  saving = false;
  newKonto: Partial<Konto> = { aktiv: true, sammelkonto: false };

  constructor(
    private kontenplanService: KontenplanService,
    private notification: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadKonten();
  }

  loadKonten(): void {
    this.loading = true;
    this.error = null;
    this.kontenplanService.getAll().subscribe({
      next: data => {
        this.konten = data;
        this.applyFilter();
        this.loading = false;
      },
      error: err => {
        this.error = err.error?.message || 'Fehler beim Laden des Kontenplans';
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    let result = this.konten;
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(k =>
        k.bezeichnung.toLowerCase().includes(term) ||
        k.kontonummer.toString().includes(term) ||
        k.kontoKlasse?.toLowerCase().includes(term)
      );
    }
    if (this.filterTyp) {
      result = result.filter(k => k.kontoTyp === this.filterTyp);
    }
    this.filteredKonten = result;
  }

  initSkr04(): void {
    if (this.initLoading) return;
    this.initLoading = true;
    this.kontenplanService.initSkr04().subscribe({
      next: () => {
        this.notification.success('SKR04-Kontenplan erfolgreich initialisiert.');
        this.initLoading = false;
        this.loadKonten();
      },
      error: err => {
        this.notification.error(err.error?.message || 'Fehler bei der SKR04-Initialisierung.');
        this.initLoading = false;
      }
    });
  }

  openNewModal(): void {
    this.newKonto = { aktiv: true, sammelkonto: false };
    this.showNewModal = true;
  }

  closeNewModal(): void {
    this.showNewModal = false;
  }

  createKonto(): void {
    if (!this.newKonto.kontonummer || !this.newKonto.bezeichnung || !this.newKonto.kontoTyp) {
      this.error = 'Kontonummer, Bezeichnung und Kontotyp sind Pflichtfelder.';
      return;
    }
    if (this.saving) return;
    this.saving = true;
    this.kontenplanService.create(this.newKonto).subscribe({
      next: created => {
        this.konten.push(created);
        this.applyFilter();
        this.notification.success('Konto erfolgreich angelegt.');
        this.saving = false;
        this.closeNewModal();
      },
      error: err => {
        this.error = err.error?.message || 'Fehler beim Anlegen des Kontos.';
        this.saving = false;
      }
    });
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  getTypLabel(typ: KontoTyp): string {
    const labels: Record<KontoTyp, string> = {
      AKTIV: 'Aktivkonto', PASSIV: 'Passivkonto',
      AUFWAND: 'Aufwandskonto', ERTRAG: 'Ertragskonto'
    };
    return labels[typ] || typ;
  }

  getTypBadge(typ: KontoTyp): string {
    const badges: Record<KontoTyp, string> = {
      AKTIV: 'bg-primary', PASSIV: 'bg-warning text-dark',
      AUFWAND: 'bg-danger', ERTRAG: 'bg-success'
    };
    return badges[typ] || 'bg-secondary';
  }

  countByTyp(typ: string): number {
    return this.konten.filter(k => k.kontoTyp === typ).length;
  }

  clearError(): void {
    this.error = null;
  }
}
