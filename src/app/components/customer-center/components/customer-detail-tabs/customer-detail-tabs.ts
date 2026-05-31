import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Dialog } from 'primeng/dialog';

import { Customer } from '../../../../models/Customer';
import { Contract } from '../../../../models/Contract';
import { Invoice } from '../../../../models/Invoice';
import { OpenItem } from '../../../../models/OpenItem';
import { Subscription } from '../../../../models/Subscription';
import { CrmNote, NotePriority } from '../../../../models/CrmNote';
import { CrmActivity, ActivityType, ActivityStatus } from '../../../../models/CrmActivity';
import { CrmContact } from '../../../../models/CrmContact';
import { CrmDocument, DocumentType } from '../../../../models/CrmDocument';
import { OpenItemService } from '../../../../services/open-item-service';
import { NotificationService } from '../../../../services/notification.service';
import { KontenblattEintrag } from '../../../../models/KontenblattEintrag';

type Tab = 'uebersicht' | 'vertraege' | 'rechnungen' | 'zahlungen' | 'crm' | 'kontenblatt';
type CrmSubTab = 'aktivitaeten' | 'notizen' | 'kontakte' | 'dokumente';

interface MonthlyRow { month: string; einnahmen: number; count: number; }

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
  @Input() contractSubscriptions: { [contractId: string]: Subscription[] } = {};
  @Input() loading = false;

  @Output() contractExpanded = new EventEmitter<string>();
  @Output() noteCreated = new EventEmitter<Partial<CrmNote>>();
  @Output() noteDeleted = new EventEmitter<string>();
  @Output() activityCreated = new EventEmitter<Partial<CrmActivity>>();
  @Output() activityCompleted = new EventEmitter<string>();
  @Output() activityDeleted = new EventEmitter<string>();
  @Output() contactCreated = new EventEmitter<Partial<CrmContact>>();
  @Output() contactDeleted = new EventEmitter<string>();
  @Output() documentUploaded = new EventEmitter<{ file: File; documentType?: string; description?: string }>();
  @Output() documentDeleted = new EventEmitter<string>();
  @Output() openItemUpdated = new EventEmitter<OpenItem>();

  activeTab: Tab = 'uebersicht';
  activeCrmSubTab: CrmSubTab = 'aktivitaeten';

  // Kontenblatt
  kontenblattEintraege: KontenblattEintrag[] = [];
  kontenblattLoading = false;
  kontenblattSortDir: 'ASC' | 'DESC' = 'DESC';

  // Vertrag-Expansion
  expandedContractId: string | null = null;

  // Modals
  showNoteModal = false;    noteForm: Partial<CrmNote> = {};
  showActivityModal = false; activityForm: Partial<CrmActivity> = {}; activityDateString = ''; dueDateString = '';
  showContactModal = false;  contactForm: Partial<CrmContact> = {};
  showDocumentModal = false; selectedFile: File | null = null; docDescription = ''; docType: DocumentType = 'SONSTIGES';

  // Payment Modal
  showPayModal = false;
  selectedOpenItem: OpenItem | null = null;
  payAmount = 0;
  payMethod = '';
  payRef = '';
  paying = false;

  readonly notePriorityOptions: { label: string; value: NotePriority }[] = [
    { label: 'Niedrig', value: 'NIEDRIG' }, { label: 'Mittel', value: 'MITTEL' }, { label: 'Hoch', value: 'HOCH' }
  ];
  readonly activityTypeOptions: { label: string; value: ActivityType; icon: string }[] = [
    { label: 'Anruf', value: 'ANRUF', icon: 'bi-telephone' }, { label: 'E-Mail', value: 'EMAIL', icon: 'bi-envelope' },
    { label: 'Meeting', value: 'MEETING', icon: 'bi-people' }, { label: 'Aufgabe', value: 'AUFGABE', icon: 'bi-check2-square' },
    { label: 'Besuch', value: 'BESUCH', icon: 'bi-geo-alt' }, { label: 'Sonstiges', value: 'SONSTIGES', icon: 'bi-three-dots' }
  ];
  readonly documentTypeOptions: { label: string; value: DocumentType }[] = [
    { label: 'PDF', value: 'PDF' }, { label: 'E-Mail', value: 'EMAIL' }, { label: 'Bild', value: 'BILD' },
    { label: 'Vertrag', value: 'VERTRAG' }, { label: 'Angebot', value: 'ANGEBOT' },
    { label: 'Rechnung', value: 'RECHNUNG' }, { label: 'Sonstiges', value: 'SONSTIGES' }
  ];

  constructor(
    private openItemService: OpenItemService,
    private notification: NotificationService
  ) {}

  ngOnChanges(): void {
    if (!this.customer) {
      this.activeTab = 'uebersicht';
      this.expandedContractId = null;
      this.kontenblattEintraege = [];
    } else if (this.activeTab === 'kontenblatt') {
      this.loadKontenblatt();
    }
  }

  setTab(t: Tab): void {
    this.activeTab = t;
    if (t === 'kontenblatt' && this.customer?.id && !this.kontenblattLoading && this.kontenblattEintraege.length === 0) {
      this.loadKontenblatt();
    }
  }

  setCrmSubTab(s: CrmSubTab): void { this.activeCrmSubTab = s; }

  loadKontenblatt(): void {
    if (!this.customer?.id) return;
    this.kontenblattLoading = true;
    this.openItemService.getKontenblatt(this.customer.id, this.kontenblattSortDir).subscribe({
      next: eintraege => { this.kontenblattEintraege = eintraege; this.kontenblattLoading = false; },
      error: () => { this.kontenblattLoading = false; }
    });
  }

  setKontenblattSort(dir: 'ASC' | 'DESC'): void {
    if (this.kontenblattSortDir === dir) return;
    this.kontenblattSortDir = dir;
    this.loadKontenblatt();
  }

  // ─── Vertrag expandieren ──────────────────────────────────────────────────
  toggleContract(contractId: string): void {
    if (this.expandedContractId === contractId) {
      this.expandedContractId = null;
    } else {
      this.expandedContractId = contractId;
      this.contractExpanded.emit(contractId);
    }
  }

  getSubscriptionsForContract(contractId: string): Subscription[] {
    return this.contractSubscriptions[contractId] ?? [];
  }

  isLoadingContractSubs(contractId: string): boolean {
    return this.expandedContractId === contractId && !(contractId in this.contractSubscriptions);
  }

  // Rechnungen nach Vertrag filtern (über Subscriptions)
  getInvoicesForContract(contractId: string): Invoice[] {
    const subs = this.contractSubscriptions[contractId];
    if (!subs || subs.length === 0) return [];
    const subIds = new Set(subs.map(s => s.id));
    return this.invoices.filter(inv => inv.invoiceBatchId || (inv as any).subscriptionId && subIds.has((inv as any).subscriptionId));
  }

  // Offene Posten nach Vertrag filtern
  getOpenItemsForContract(contractId: string): OpenItem[] {
    const subs = this.contractSubscriptions[contractId];
    if (!subs || subs.length === 0) return [];
    const subIds = new Set(subs.map(s => s.id));
    return this.openItems.filter(oi => (oi as any).subscriptionId && subIds.has((oi as any).subscriptionId));
  }

  // ─── KPI ──────────────────────────────────────────────────────────────────
  get gesamtUmsatz(): number {
    return this.invoices.reduce((s, i) => s + (i.totalAmount ?? 0), 0);
  }
  get bezahlterUmsatz(): number {
    return this.invoices.filter(i => (i.status as string) === 'PAID' || i.status === 'SENT').reduce((s, i) => s + (i.totalAmount ?? 0), 0);
  }

  get bezahlteRechnungenCount(): number {
    return this.invoices.filter(i => (i.status as string) === 'PAID' || i.status === 'SENT').length;
  }

  getOutstandingForInvoice(invoiceNumber?: string): number | null {
    if (!invoiceNumber) return null;
    const oi = this.openItems.find(o => o.invoiceNumber === invoiceNumber);
    return oi?.outstandingAmount ?? null;
  }
  get offenePostenSumme(): number {
    return this.openItems.filter(o => o.status === 'OPEN' || o.status === 'OVERDUE' || o.status === 'PARTIALLY_PAID')
      .reduce((s, o) => s + (o.outstandingAmount ?? o.amount ?? 0), 0);
  }
  get ueberfaelligePosten(): number { return this.openItems.filter(o => o.status === 'OVERDUE').length; }
  get aktiverVertragCount(): number { return this.contracts.filter(c => c.contractStatus === 'ACTIVE').length; }
  get offeneAktivitaetenCount(): number { return this.activities.filter(a => a.status === 'OFFEN' || a.status === 'IN_BEARBEITUNG').length; }
  get offenePostenCount(): number { return this.openItems.filter(o => o.status === 'OPEN' || o.status === 'OVERDUE' || o.status === 'PARTIALLY_PAID').length; }
  get hasPrimaryContact(): boolean { return this.contacts.some(c => c.primaryContact); }

  // ─── Kontenblatt – Monatliche Übersicht ───────────────────────────────────
  get kontenblattRows(): MonthlyRow[] {
    const map = new Map<string, MonthlyRow>();
    for (const inv of this.invoices) {
      if (!inv.invoiceDate) continue;
      const d = new Date(inv.invoiceDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
      const row = map.get(key) ?? { month: label, einnahmen: 0, count: 0 };
      row.einnahmen += inv.totalAmount ?? 0;
      row.count++;
      map.set(key, row);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(e => e[1]);
  }

  get kontenblattGesamtEinnahmen(): number {
    return this.kontenblattRows.reduce((s, r) => s + r.einnahmen, 0);
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
  formatCurrency(v: any): string {
    if (v == null) return '–';
    return Number(v).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  }
  formatFileSize(b?: number): string {
    if (!b) return '–';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }

  // ─── Badges ───────────────────────────────────────────────────────────────
  contractStatusBadge(s?: string): string {
    const m: any = { ACTIVE:'badge bg-success', DRAFT:'badge bg-warning text-dark', SUSPENDED:'badge bg-secondary', TERMINATED:'badge bg-dark text-white', EXPIRED:'badge bg-danger' };
    return m[s ?? ''] ?? 'badge bg-light text-dark';
  }
  contractStatusLabel(s?: string): string {
    const m: any = { ACTIVE:'Aktiv', DRAFT:'Entwurf', SUSPENDED:'Ausgesetzt', TERMINATED:'Gekündigt', EXPIRED:'Abgelaufen' };
    return m[s ?? ''] ?? s ?? '–';
  }
  invoiceStatusBadge(s?: string): string {
    const m: any = { PAID:'badge bg-success', SENT:'badge bg-primary', DRAFT:'badge bg-warning text-dark', OVERDUE:'badge bg-danger', CANCELLED:'badge bg-secondary', ACTIVE:'badge bg-info' };
    return m[s ?? ''] ?? 'badge bg-light text-dark';
  }
  invoiceStatusLabel(s?: string): string {
    const m: any = { PAID:'Bezahlt', SENT:'Versendet', DRAFT:'Entwurf', OVERDUE:'Überfällig', CANCELLED:'Storniert', ACTIVE:'Aktiv' };
    return m[s ?? ''] ?? s ?? '–';
  }
  openItemStatusBadge(s?: string): string {
    const m: any = { PAID:'badge bg-success', OPEN:'badge bg-primary', OVERDUE:'badge bg-danger', CANCELLED:'badge bg-secondary', PARTIALLY_PAID:'badge bg-warning text-dark' };
    return m[s ?? ''] ?? 'badge bg-light text-dark';
  }
  openItemStatusLabel(s?: string): string {
    const m: any = { PAID:'Bezahlt', OPEN:'Offen', OVERDUE:'Überfällig', CANCELLED:'Storniert', PARTIALLY_PAID:'Teilzahlung' };
    return m[s ?? ''] ?? s ?? '–';
  }
  activityStatusBadge(s?: ActivityStatus): string {
    const m: any = { OFFEN:'badge bg-primary', IN_BEARBEITUNG:'badge bg-warning text-dark', ABGESCHLOSSEN:'badge bg-success', ABGESAGT:'badge bg-secondary' };
    return m[s ?? ''] ?? 'badge bg-light text-dark';
  }
  activityTypeIcon(t?: ActivityType): string {
    return this.activityTypeOptions.find(o => o.value === t)?.icon ?? 'bi-circle';
  }
  priorityBadge(p?: NotePriority): string {
    const m: any = { HOCH:'badge bg-danger', MITTEL:'badge bg-warning text-dark', NIEDRIG:'badge bg-secondary' };
    return m[p ?? ''] ?? 'badge bg-light text-dark';
  }
  docTypeIcon(t?: DocumentType): string {
    if (!t) return 'bi-file-earmark text-secondary';
    if (['PDF','VERTRAG','ANGEBOT','RECHNUNG'].includes(t)) return 'bi-file-earmark-pdf text-danger';
    if (t === 'BILD') return 'bi-file-earmark-image text-info';
    if (t === 'EMAIL') return 'bi-envelope text-primary';
    return 'bi-file-earmark text-secondary';
  }
  subStatusBadge(s?: string): string {
    const m: any = { ACTIVE:'badge bg-success', PAUSED:'badge bg-warning text-dark', CANCELLED:'badge bg-secondary', EXPIRED:'badge bg-danger' };
    return m[s ?? ''] ?? 'badge bg-light text-dark';
  }
  billingCycleLabel(c?: string): string {
    const m: any = { MONTHLY:'Monatlich', QUARTERLY:'Vierteljährlich', SEMI_ANNUALLY:'Halbjährlich', ANNUALLY:'Jährlich' };
    return m[c ?? ''] ?? c ?? '–';
  }

  // ─── Modals ───────────────────────────────────────────────────────────────
  openNoteModal(): void { this.noteForm = { priority: 'MITTEL' }; this.showNoteModal = true; }
  closeNoteModal(): void { this.showNoteModal = false; this.noteForm = {}; }
  saveNote(): void { if (!this.noteForm.title?.trim()) return; this.noteCreated.emit({ ...this.noteForm }); this.closeNoteModal(); }

  openActivityModal(): void {
    this.activityForm = { activityType: 'ANRUF', status: 'OFFEN' };
    this.activityDateString = new Date().toISOString().slice(0, 16);
    this.dueDateString = '';
    this.showActivityModal = true;
  }
  closeActivityModal(): void { this.showActivityModal = false; this.activityForm = {}; }
  saveActivity(): void {
    if (!this.activityForm.title?.trim()) return;
    this.activityCreated.emit({ ...this.activityForm, activityDate: this.activityDateString ? new Date(this.activityDateString) : undefined, dueDate: this.dueDateString ? new Date(this.dueDateString) : undefined });
    this.closeActivityModal();
  }

  openContactModal(): void { this.contactForm = { primaryContact: false }; this.showContactModal = true; }
  closeContactModal(): void { this.showContactModal = false; this.contactForm = {}; }
  saveContact(): void {
    if (!this.contactForm.firstName?.trim() || !this.contactForm.lastName?.trim()) return;
    this.contactCreated.emit({ ...this.contactForm }); this.closeContactModal();
  }

  openDocumentModal(): void { this.selectedFile = null; this.docDescription = ''; this.docType = 'SONSTIGES'; this.showDocumentModal = true; }
  closeDocumentModal(): void { this.showDocumentModal = false; this.selectedFile = null; }
  onFileSelected(event: Event): void {
    const f = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.selectedFile = f;
    if (f) {
      if (f.type === 'application/pdf') this.docType = 'PDF';
      else if (f.type.startsWith('image/')) this.docType = 'BILD';
      else if (f.name.endsWith('.eml')) this.docType = 'EMAIL';
    }
  }
  uploadDocument(): void {
    if (!this.selectedFile) return;
    this.documentUploaded.emit({ file: this.selectedFile, documentType: this.docType, description: this.docDescription });
    this.closeDocumentModal();
  }

  // ─── Payment Modal ────────────────────────────────────────────────────────
  canPay(item: OpenItem): boolean { return item.status !== 'CANCELLED' && item.status !== 'PAID'; }

  openPayModal(item: OpenItem): void {
    this.selectedOpenItem = item;
    this.payAmount = item.outstandingAmount ?? item.amount ?? 0;
    this.payMethod = '';
    this.payRef = '';
    this.showPayModal = true;
  }
  closePayModal(): void { this.showPayModal = false; this.selectedOpenItem = null; }
  setFullPayment(): void { if (this.selectedOpenItem) this.payAmount = this.selectedOpenItem.outstandingAmount ?? this.selectedOpenItem.amount ?? 0; }
  setHalfPayment(): void { if (this.selectedOpenItem) this.payAmount = Math.round(((this.selectedOpenItem.outstandingAmount ?? this.selectedOpenItem.amount ?? 0) / 2) * 100) / 100; }

  confirmPayment(): void {
    if (!this.selectedOpenItem?.id || this.paying) return;
    this.paying = true;
    this.openItemService.recordPayment(this.selectedOpenItem.id, this.payAmount, this.payMethod, this.payRef).subscribe({
      next: updated => {
        this.paying = false;
        this.showPayModal = false;
        this.openItemUpdated.emit(updated);
        this.notification.success('Zahlung wurde erfasst.');
      },
      error: err => {
        this.paying = false;
        this.notification.error(err.error?.message || 'Fehler beim Erfassen der Zahlung');
      }
    });
  }

  trackById(_: number, item: any): string { return item.id; }
}
