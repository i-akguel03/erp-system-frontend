import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BuchhaltungService } from '../../../services/buchhaltung.service';

interface GuvZeile {
  bezeichnung: string;
  betrag: number;
  typ: 'ERTRAG' | 'AUFWAND';
}

@Component({
  selector: 'app-guv-bericht',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './guv-bericht.html',
  styleUrls: ['./guv-bericht.scss']
})
export class GuvBerichtComponent implements OnInit {
  loading = false;
  error: string | null = null;
  selectedJahr: number = new Date().getFullYear();
  verfuegbareJahre: number[] = [];

  ertraege: GuvZeile[] = [];
  aufwendungen: GuvZeile[] = [];
  gesamtErtrag = 0;
  gesamtAufwand = 0;
  ergebnis = 0;

  constructor(private buchhaltungService: BuchhaltungService) {}

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    this.verfuegbareJahre = [currentYear - 1, currentYear, currentYear + 1];
    this.loadGuv();
  }

  loadGuv(): void {
    this.loading = true;
    this.error = null;
    this.ertraege = [];
    this.aufwendungen = [];

    this.buchhaltungService.getGuvUebersicht(this.selectedJahr).subscribe({
      next: data => {
        this.processGuvData(data);
        this.loading = false;
      },
      error: err => {
        this.error = err.error?.message || 'Fehler beim Laden der GuV-Übersicht';
        this.loading = false;
      }
    });
  }

  private readonly SUMMARY_KEYS = new Set(['GESAMT_ERTRAG', 'GESAMT_AUFWAND', 'ERGEBNIS']);

  private processGuvData(data: { [bezeichnung: string]: number }): void {
    this.ertraege = [];
    this.aufwendungen = [];

    Object.entries(data).forEach(([bezeichnung, saldo]) => {
      if (this.SUMMARY_KEYS.has(bezeichnung)) return;
      if (saldo >= 0) {
        this.ertraege.push({ bezeichnung, betrag: saldo, typ: 'ERTRAG' });
      } else {
        this.aufwendungen.push({ bezeichnung, betrag: Math.abs(saldo), typ: 'AUFWAND' });
      }
    });

    this.ertraege.sort((a, b) => b.betrag - a.betrag);
    this.aufwendungen.sort((a, b) => b.betrag - a.betrag);

    this.gesamtErtrag = this.ertraege.reduce((s, z) => s + z.betrag, 0);
    this.gesamtAufwand = this.aufwendungen.reduce((s, z) => s + z.betrag, 0);
    this.ergebnis = this.gesamtErtrag - this.gesamtAufwand;
  }

  get hasData(): boolean {
    return this.ertraege.length > 0 || this.aufwendungen.length > 0;
  }

  clearError(): void { this.error = null; }
}
