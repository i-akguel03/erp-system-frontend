import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { Customer } from '../../models/Customer';
import { Contract } from '../../models/Contract';
import { Invoice } from '../../models/Invoice';
import { OpenItem } from '../../models/OpenItem';
import { CrmNote } from '../../models/CrmNote';
import { CrmActivity } from '../../models/CrmActivity';
import { CrmContact } from '../../models/CrmContact';
import { CrmDocument } from '../../models/CrmDocument';

import { CustomerService } from '../../services/customer-service';
import { ContractService } from '../../services/contract-service';
import { InvoiceService } from '../../services/invoice-service';
import { OpenItemService } from '../../services/open-item-service';
import { CrmService } from '../../services/crm.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmationService } from 'primeng/api';

import { CustomerSelectListComponent } from './components/customer-select-list/customer-select-list';
import { CustomerDetailTabsComponent } from './components/customer-detail-tabs/customer-detail-tabs';

@Component({
  selector: 'app-customer-center',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CustomerSelectListComponent,
    CustomerDetailTabsComponent
  ],
  templateUrl: './customer-center.html',
  styleUrls: ['./customer-center.scss']
})
export class CustomerCenterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // ─── Daten ────────────────────────────────────────────────────────────────
  customers: Customer[] = [];
  selectedCustomer: Customer | null = null;

  contracts: Contract[] = [];
  invoices: Invoice[] = [];
  openItems: OpenItem[] = [];
  notes: CrmNote[] = [];
  activities: CrmActivity[] = [];
  contacts: CrmContact[] = [];
  documents: CrmDocument[] = [];

  // ─── UI-Status ────────────────────────────────────────────────────────────
  loadingCustomers = false;
  loadingDetail = false;
  error: string | null = null;

  isMobile = false;
  mobileView: 'list' | 'detail' = 'list';

  constructor(
    private customerService: CustomerService,
    private contractService: ContractService,
    private invoiceService: InvoiceService,
    private openItemService: OpenItemService,
    private crmService: CrmService,
    private notificationService: NotificationService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.checkMobile();
    this.loadCustomers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.unlockBodyScroll();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkMobile();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isMobile && this.mobileView === 'detail') {
      this.navigateBack();
    }
  }

  // ─── Mobile ───────────────────────────────────────────────────────────────

  private checkMobile(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 768;
    if (wasMobile !== this.isMobile) {
      if (!this.isMobile) {
        this.mobileView = 'list';
        this.unlockBodyScroll();
      } else {
        this.lockBodyScroll();
      }
    }
  }

  navigateBack(): void {
    this.mobileView = 'list';
  }

  private lockBodyScroll(): void {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
  }

  private unlockBodyScroll(): void {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
  }

  // ─── Kundenliste laden ────────────────────────────────────────────────────

  loadCustomers(): void {
    this.loadingCustomers = true;
    this.error = null;
    this.customerService.getCustomers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: customers => {
          this.customers = customers;
          this.loadingCustomers = false;
        },
        error: err => {
          this.error = err.error?.message || 'Fehler beim Laden der Kunden';
          this.loadingCustomers = false;
        }
      });
  }

  // ─── Kundenauswahl ────────────────────────────────────────────────────────

  onCustomerSelected(customer: Customer): void {
    if (this.selectedCustomer?.id === customer.id && !this.isMobile) return;
    this.selectedCustomer = customer;
    this.clearDetail();
    this.loadAllDetailData(customer.id!);
    if (this.isMobile) {
      this.mobileView = 'detail';
    }
  }

  private clearDetail(): void {
    this.contracts = [];
    this.invoices = [];
    this.openItems = [];
    this.notes = [];
    this.activities = [];
    this.contacts = [];
    this.documents = [];
  }

  private loadAllDetailData(customerId: string): void {
    this.loadingDetail = true;

    let pending = 7;
    const done = () => { if (--pending === 0) this.loadingDetail = false; };

    this.contractService.getContractsByCustomer(customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: c => { this.contracts = c; done(); }, error: () => done() });

    this.invoiceService.getInvoicesByCustomer(customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: i => { this.invoices = i; done(); }, error: () => done() });

    this.openItemService.getOpenItemsByCustomer(customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: o => { this.openItems = o; done(); }, error: () => done() });

    this.crmService.getNotesByCustomer(customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: n => { this.notes = n; done(); }, error: () => done() });

    this.crmService.getActivitiesByCustomer(customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: a => { this.activities = a; done(); }, error: () => done() });

    this.crmService.getContactsByCustomer(customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: c => { this.contacts = c; done(); }, error: () => done() });

    this.crmService.getDocumentsByCustomer(customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: d => { this.documents = d; done(); }, error: () => done() });
  }

  // ─── CRM-Aktionen (werden von CustomerDetailTabs emitted) ─────────────────

  onNoteCreated(note: Partial<CrmNote>): void {
    if (!this.selectedCustomer?.id) return;
    this.crmService.createNote(note, this.selectedCustomer.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: created => {
          this.notes = [created, ...this.notes];
          this.notificationService.success('Notiz erstellt');
        },
        error: () => this.notificationService.error('Fehler beim Erstellen der Notiz')
      });
  }

  onNoteDeleted(id: string): void {
    this.confirmationService.confirm({
      message: 'Notiz wirklich löschen?',
      header: 'Notiz löschen',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Löschen',
      rejectLabel: 'Abbrechen',
      accept: () => {
        this.crmService.deleteNote(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.notes = this.notes.filter(n => n.id !== id);
              this.notificationService.success('Notiz gelöscht');
            },
            error: () => this.notificationService.error('Fehler beim Löschen der Notiz')
          });
      }
    });
  }

  onActivityCreated(activity: Partial<CrmActivity>): void {
    if (!this.selectedCustomer?.id) return;
    this.crmService.createActivity(activity, this.selectedCustomer.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: created => {
          this.activities = [created, ...this.activities];
          this.notificationService.success('Aktivität erstellt');
        },
        error: () => this.notificationService.error('Fehler beim Erstellen der Aktivität')
      });
  }

  onActivityCompleted(id: string): void {
    this.crmService.completeActivity(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: updated => {
          const idx = this.activities.findIndex(a => a.id === id);
          if (idx >= 0) this.activities[idx] = updated;
          this.activities = [...this.activities];
          this.notificationService.success('Aktivität abgeschlossen');
        },
        error: () => this.notificationService.error('Fehler beim Abschließen der Aktivität')
      });
  }

  onActivityDeleted(id: string): void {
    this.confirmationService.confirm({
      message: 'Aktivität wirklich löschen?',
      header: 'Aktivität löschen',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Löschen',
      rejectLabel: 'Abbrechen',
      accept: () => {
        this.crmService.deleteActivity(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.activities = this.activities.filter(a => a.id !== id);
              this.notificationService.success('Aktivität gelöscht');
            },
            error: () => this.notificationService.error('Fehler beim Löschen der Aktivität')
          });
      }
    });
  }

  onContactCreated(contact: Partial<CrmContact>): void {
    if (!this.selectedCustomer?.id) return;
    this.crmService.createContact(contact, this.selectedCustomer.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: created => {
          this.contacts = [...this.contacts, created];
          this.notificationService.success('Ansprechpartner erstellt');
        },
        error: () => this.notificationService.error('Fehler beim Erstellen des Ansprechpartners')
      });
  }

  onContactDeleted(id: string): void {
    this.confirmationService.confirm({
      message: 'Ansprechpartner wirklich löschen?',
      header: 'Ansprechpartner löschen',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Löschen',
      rejectLabel: 'Abbrechen',
      accept: () => {
        this.crmService.deleteContact(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.contacts = this.contacts.filter(c => c.id !== id);
              this.notificationService.success('Ansprechpartner gelöscht');
            },
            error: () => this.notificationService.error('Fehler beim Löschen des Ansprechpartners')
          });
      }
    });
  }

  onDocumentUploaded(payload: { file: File; documentType?: string; description?: string }): void {
    if (!this.selectedCustomer?.id) return;
    this.crmService.uploadDocument(payload.file, this.selectedCustomer.id, undefined, payload.documentType, payload.description)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: doc => {
          this.documents = [doc, ...this.documents];
          this.notificationService.success('Dokument hochgeladen');
        },
        error: () => this.notificationService.error('Fehler beim Hochladen des Dokuments')
      });
  }

  onDocumentDeleted(id: string): void {
    this.confirmationService.confirm({
      message: 'Dokument wirklich löschen?',
      header: 'Dokument löschen',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Löschen',
      rejectLabel: 'Abbrechen',
      accept: () => {
        this.crmService.deleteDocument(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.documents = this.documents.filter(d => d.id !== id);
              this.notificationService.success('Dokument gelöscht');
            },
            error: () => this.notificationService.error('Fehler beim Löschen des Dokuments')
          });
      }
    });
  }

  getDownloadUrl(documentId: string): string {
    return this.crmService.downloadDocumentUrl(documentId);
  }
}
