import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Dialog } from 'primeng/dialog';

import { Customer } from '../../../../models/Customer';
import { Contract } from '../../../../models/Contract';
import { Invoice } from '../../../../models/Invoice';
import { OpenItem } from '../../../../models/OpenItem';
import { CrmNote, NotePriority } from '../../../../models/CrmNote';
import { CrmActivity, ActivityType, ActivityStatus } from '../../../../models/CrmActivity';
import { CrmContact } from '../../../../models/CrmContact';
import { CrmDocument, DocumentType } from '../../../../models/CrmDocument';

type Tab = 'uebersicht' | 'vertraege' | 'rechnungen' | 'zahlungen' | 'crm' | 'kontenblatt';
type CrmSubTab = 'aktivitaeten' | 'notizen' | 'kontakte' | 'dokumente';

@Component({
  selector: 'app-customer-detail-tabs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Dialog],
  templateUrl: './customer-detail-tabs.html',
  styleUrls: ['./customer-detail-tabs.scss']
})
export class CustomerDetailTabsComponent implements OnChanges {
  @Input() customer: Customer | null = null;
  @Input() contracts: Contract[] = [];
  @Input() invoices: Invoice[] = [];
  @Input() openItems: OpenItem[] = [];
  @Input() notes: CrmNote[] = [];
  @Input() activities: CrmActivity[] = [];
  @Input() contacts: CrmContact[] = [];
  @Input() documents: CrmDocument[] = [];
  @Input() loading = false;

  @Output() noteCreated = new EventEmitter<Partial<CrmNote>>();
  @Output() noteDeleted = new EventEmitter<string>();
  @Output() activityCreated = new EventEmitter<Partial<CrmActivity>>();
  @Output() activityCompleted = new EventEmitter<string>();
  @Output() activityDeleted = new EventEmitter<string>();
  @Output() contactCreated = new EventEmitter<Partial<CrmContact>>();
  @Output() contactDeleted = new EventEmitter<string>();
  @Output() documentUploaded = new EventEmitter<{ file: File; documentType?: string; description?: string }>();
  @Output() documentDeleted = new EventEmitter<string>();

  activeTab: Tab = 'uebersicht';
  activeCrmSubTab: CrmSubTab = 'aktivitaeten';

  // ─── Modals ────────────────────────────────────────────────────────────────
  showNoteModal = false;
  noteForm: Partial<CrmNote> = {};

  showActivityModal = false;
  activityForm: Partial<CrmActivity> = {};
  activityDateString = '';
  dueDateString = '';

  showContactModal = false;
  contactForm: Partial<CrmContact> = {};

  showDocumentModal = false;
  selectedFile: File | null = null;
  docDescription = '';
  docType: DocumentType = 'SONSTIGES';

  readonly notePriorityOptions: { label: string; value: NotePriority }[] = [
    { label: 'Niedrig', value: 'NIEDRIG' },
    { label: 'Mittel', value: 'MITTEL' },
    { label: 'Hoch', value: 'HOCH' },
  ];

  readonly activityTypeOptions: { label: string; value: ActivityType; icon: string }[] = [
    { label: 'Anruf', value: 'ANRUF', icon: 'bi-telephone' },
    { label: 'E-Mail', value: 'EMAIL', icon: 'bi-envelope' },
    { label: 'Meeting', value: 'MEETING', icon: 'bi-people' },
    { label: 'Aufgabe', value: 'AUFGABE', icon: 'bi-check2-square' },
    { label: 'Besuch', value: 'BESUCH', icon: 'bi-geo-alt' },
    { label: 'Sonstiges', value: 'SONSTIGES', icon: 'bi-three-dots' },
  ];

  readonly documentTypeOptions: { label: string; value: DocumentType }[] = [
    { label: 'PDF', value: 'PDF' },
    { label: 'E-Mail', value: 'EMAIL' },
    { label: 'Bild', value: 'BILD' },
    { label: 'Vertrag', value: 'VERTRAG' },
    { label: 'Angebot', value: 'ANGEBOT' },
    { label: 'Rechnung', value: 'RECHNUNG' },
    { label: 'Sonstiges', value: 'SONSTIGES' },
  ];

  ngOnChanges(): void {
    if (!this.customer) {
      this.activeTab = 'uebersicht';
    }
  }

  setTab(tab: Tab): void { this.activeTab = tab; }
  setCrmSubTab(sub: CrmSubTab): void { this.activeCrmSubTab = sub; }

  // ─── KPI-Berechnungen ──────────────────────────────────────────────────────

  get offenePostenSumme(): number {
    return this.openItems
      .filter(o => o.status === 'OPEN' || o.status === 'OVERDUE' || o.status === 'PARTIALLY_PAID')
      .reduce((sum, o) => sum + (o.outstandingAmount ?? o.amount ?? 0), 0);
  }

  get ueberfaelligePosten(): number {
    return this.openItems.filter(o => o.status === 'OVERDUE').length;
  }

  get aktiverVertragCount(): number {
    return this.contracts.filter(c => c.contractStatus === 'ACTIVE').length;
  }

  get offeneAktivitaetenCount(): number {
    return this.activities.filter(a => a.status === 'OFFEN' || a.status === 'IN_BEARBEITUNG').length;
  }

  // ─── Formatierung ─────────────────────────────────────────────────────────

  formatDate(d: any): string {
    if (!d) return '–';
    try { return new Date(d).toLocaleDateString('de-DE'); } catch { return '–'; }
  }

  formatDateTime(d: any): string {
    if (!d) return '–';
    try { return new Date(d).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return '–'; }
  }

  formatCurrency(amount: any): string {
    if (amount == null) return '–';
    return Number(amount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '–';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // ─── Status-Badges ────────────────────────────────────────────────────────

  contractStatusBadge(status?: string): string {
    switch (status) {
      case 'ACTIVE': return 'badge bg-success';
      case 'DRAFT': return 'badge bg-warning text-dark';
      case 'SUSPENDED': return 'badge bg-secondary';
      case 'TERMINATED': return 'badge bg-dark text-white';
      case 'EXPIRED': return 'badge bg-danger';
      default: return 'badge bg-light text-dark';
    }
  }

  contractStatusLabel(status?: string): string {
    const map: any = { ACTIVE: 'Aktiv', DRAFT: 'Entwurf', SUSPENDED: 'Ausgesetzt', TERMINATED: 'Gekündigt', EXPIRED: 'Abgelaufen' };
    return map[status ?? ''] ?? status ?? '–';
  }

  invoiceStatusBadge(status?: string): string {
    switch (status) {
      case 'PAID': return 'badge bg-success';
      case 'SENT': return 'badge bg-primary';
      case 'DRAFT': return 'badge bg-warning text-dark';
      case 'OVERDUE': return 'badge bg-danger';
      case 'CANCELLED': return 'badge bg-secondary';
      default: return 'badge bg-light text-dark';
    }
  }

  invoiceStatusLabel(status?: string): string {
    const map: any = { PAID: 'Bezahlt', SENT: 'Versendet', DRAFT: 'Entwurf', OVERDUE: 'Überfällig', CANCELLED: 'Storniert' };
    return map[status ?? ''] ?? status ?? '–';
  }

  openItemStatusBadge(status?: string): string {
    switch (status) {
      case 'PAID': return 'badge bg-success';
      case 'OPEN': return 'badge bg-primary';
      case 'OVERDUE': return 'badge bg-danger';
      case 'CANCELLED': return 'badge bg-secondary';
      case 'PARTIALLY_PAID': return 'badge bg-warning text-dark';
      default: return 'badge bg-light text-dark';
    }
  }

  openItemStatusLabel(status?: string): string {
    const map: any = { PAID: 'Bezahlt', OPEN: 'Offen', OVERDUE: 'Überfällig', CANCELLED: 'Storniert', PARTIALLY_PAID: 'Teilzahlung' };
    return map[status ?? ''] ?? status ?? '–';
  }

  activityStatusBadge(status?: ActivityStatus): string {
    switch (status) {
      case 'OFFEN': return 'badge bg-primary';
      case 'IN_BEARBEITUNG': return 'badge bg-warning text-dark';
      case 'ABGESCHLOSSEN': return 'badge bg-success';
      case 'ABGESAGT': return 'badge bg-secondary';
      default: return 'badge bg-light text-dark';
    }
  }

  activityTypeIcon(type?: ActivityType): string {
    const opt = this.activityTypeOptions.find(o => o.value === type);
    return opt?.icon ?? 'bi-circle';
  }

  priorityBadge(priority?: NotePriority): string {
    switch (priority) {
      case 'HOCH': return 'badge bg-danger';
      case 'MITTEL': return 'badge bg-warning text-dark';
      case 'NIEDRIG': return 'badge bg-secondary';
      default: return 'badge bg-light text-dark';
    }
  }

  docTypeIcon(type?: DocumentType): string {
    switch (type) {
      case 'PDF': case 'VERTRAG': case 'ANGEBOT': case 'RECHNUNG': return 'bi-file-earmark-pdf text-danger';
      case 'BILD': return 'bi-file-earmark-image text-info';
      case 'EMAIL': return 'bi-envelope text-primary';
      default: return 'bi-file-earmark text-secondary';
    }
  }

  // ─── Note Modal ───────────────────────────────────────────────────────────

  openNoteModal(): void {
    this.noteForm = { priority: 'MITTEL' };
    this.showNoteModal = true;
  }

  closeNoteModal(): void {
    this.showNoteModal = false;
    this.noteForm = {};
  }

  saveNote(): void {
    if (!this.noteForm.title?.trim()) return;
    this.noteCreated.emit({ ...this.noteForm });
    this.closeNoteModal();
  }

  // ─── Activity Modal ───────────────────────────────────────────────────────

  openActivityModal(): void {
    this.activityForm = { activityType: 'ANRUF', status: 'OFFEN' };
    this.activityDateString = new Date().toISOString().slice(0, 16);
    this.dueDateString = '';
    this.showActivityModal = true;
  }

  closeActivityModal(): void {
    this.showActivityModal = false;
    this.activityForm = {};
  }

  saveActivity(): void {
    if (!this.activityForm.title?.trim() || !this.activityForm.activityType) return;
    this.activityCreated.emit({
      ...this.activityForm,
      activityDate: this.activityDateString ? new Date(this.activityDateString) : undefined,
      dueDate: this.dueDateString ? new Date(this.dueDateString) : undefined,
    });
    this.closeActivityModal();
  }

  // ─── Contact Modal ────────────────────────────────────────────────────────

  openContactModal(): void {
    this.contactForm = { primaryContact: false };
    this.showContactModal = true;
  }

  closeContactModal(): void {
    this.showContactModal = false;
    this.contactForm = {};
  }

  saveContact(): void {
    if (!this.contactForm.firstName?.trim() || !this.contactForm.lastName?.trim()) return;
    this.contactCreated.emit({ ...this.contactForm });
    this.closeContactModal();
  }

  // ─── Document Modal ───────────────────────────────────────────────────────

  openDocumentModal(): void {
    this.selectedFile = null;
    this.docDescription = '';
    this.docType = 'SONSTIGES';
    this.showDocumentModal = true;
  }

  closeDocumentModal(): void {
    this.showDocumentModal = false;
    this.selectedFile = null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
    if (this.selectedFile && this.docType === 'SONSTIGES') {
      const mime = this.selectedFile.type;
      if (mime === 'application/pdf') this.docType = 'PDF';
      else if (mime.startsWith('image/')) this.docType = 'BILD';
      else if (mime.includes('email') || this.selectedFile.name.endsWith('.eml')) this.docType = 'EMAIL';
    }
  }

  uploadDocument(): void {
    if (!this.selectedFile) return;
    this.documentUploaded.emit({ file: this.selectedFile, documentType: this.docType, description: this.docDescription });
    this.closeDocumentModal();
  }

  downloadDoc(documentId: string, fileName: string): void {
    window.open(`${this.getDownloadUrl(documentId)}`, '_blank');
  }

  private getDownloadUrl(id: string): string {
    return `/api/crm/documents/${id}/download`;
  }

  trackById(_index: number, item: any): string { return item.id; }
}
