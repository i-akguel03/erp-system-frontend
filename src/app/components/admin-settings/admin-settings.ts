import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSettingsService } from '../../services/admin-settings.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-settings.html'
})
export class AdminSettingsComponent implements OnInit {
  excluded: string[] = [];
  loading = false;
  error = '';
  successMessage = '';

  newEntityType = '';
  addLoading = false;
  addError = '';

  constructor(private settingsService: AdminSettingsService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.settingsService.getAuditExcluded().subscribe({
      next: (list) => {
        this.excluded = [...list].sort();
        this.loading = false;
      },
      error: () => {
        this.error = 'Einstellungen konnten nicht geladen werden.';
        this.loading = false;
      }
    });
  }

  isExcluded(type: string): boolean {
    return this.excluded.includes(type);
  }

  toggle(type: string): void {
    if (this.isExcluded(type)) {
      this.settingsService.includeEntityType(type).subscribe({
        next: () => {
          this.excluded = this.excluded.filter(e => e !== type);
          this.showSuccess(`"${type}" wird wieder ins Audit-Log geschrieben.`);
        },
        error: () => { this.error = 'Fehler beim Speichern.'; }
      });
    } else {
      this.settingsService.excludeEntityType(type).subscribe({
        next: () => {
          this.excluded = [...this.excluded, type].sort();
          this.showSuccess(`"${type}" wird nicht mehr ins Audit-Log geschrieben.`);
        },
        error: () => { this.error = 'Fehler beim Speichern.'; }
      });
    }
  }

  addCustomType(): void {
    const type = this.newEntityType.trim();
    if (!type) return;
    if (this.excluded.includes(type)) {
      this.addError = `"${type}" ist bereits ausgeschlossen.`;
      return;
    }
    this.addLoading = true;
    this.addError = '';
    this.settingsService.excludeEntityType(type).subscribe({
      next: () => {
        this.excluded = [...this.excluded, type].sort();
        this.newEntityType = '';
        this.addLoading = false;
        this.showSuccess(`"${type}" wird nicht mehr ins Audit-Log geschrieben.`);
      },
      error: () => {
        this.addError = 'Fehler beim Hinzufügen.';
        this.addLoading = false;
      }
    });
  }

  removeType(type: string): void {
    this.settingsService.includeEntityType(type).subscribe({
      next: () => {
        this.excluded = this.excluded.filter(e => e !== type);
        this.showSuccess(`"${type}" wird wieder ins Audit-Log geschrieben.`);
      },
      error: () => { this.error = 'Fehler beim Entfernen.'; }
    });
  }

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => { this.successMessage = ''; }, 3000);
  }
}
