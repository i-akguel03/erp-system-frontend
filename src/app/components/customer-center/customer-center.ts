import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { Customer } from '../../models/Customer';
import { Contract } from '../../models/Contract';
import { Invoice } from '../../models/Invoice';
import { OpenItem } from '../../models/OpenItem';
import { Subscription } from '../../models/Subscription';
import { CrmNote } from '../../models/CrmNote';
import { CrmActivity } from '../../models/CrmActivity';
import { CrmContact } from '../../models/CrmContact';
import { CrmDocument } from '../../models/CrmDocument';

import { CustomerService } from '../../services/customer-service';
import { ContractService } from '../../services/contract-service';
import { InvoiceService } from '../../services/invoice-service';
import { OpenItemService } from '../../services/open-item-service';
import { SubscriptionService } from '../../services/subscription-service';
import { CrmService } from '../../services/crm.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmationService } from 'primeng/api';

import { CustomerSelectListComponent } from './components/customer-select-list/customer-select-list';
import { CustomerDetailTabsComponent } from './components/customer-detail-tabs/customer-detail-tabs';

@Component({
  selector: 'app-customer-center',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomerSelectListComponent, CustomerDetailTabsComponent],
  templateUrl: './customer-center.html',
  styleUrls: ['./customer-center.scss']
})
export class CustomerCenterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // ─── Kundenliste (paginiert) ──────────────────────────────────────────────
  customers: Customer[] = [];
  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;
  loadingCustomers = false;
  listError: string | null = null;

  // ─── Ausgewählter Kunde + Detaildaten ─────────────────────────────────────
  selectedCustomer: Customer | null = null;
  contracts: Contract[] = [];
  invoices: Invoice[] = [];
  openItems: OpenItem[] = [];
  notes: CrmNote[] = [];
  activities: CrmActivity[] = [];
  contacts: CrmContact[] = [];
  documents: CrmDocument[] = [];

  // Abonnements pro Vertrag – lazy geladen bei Vertrags-Klick
  contractSubscriptions: { [contractId: string]: Subscription[] } = {};

  loadingDetail = false;

  // ─── Mobile ───────────────────────────────────────────────────────────────
  isMobile = false;
  mobileView: 'list' | 'detail' = 'list';

  constructor(
    private customerService: CustomerService,
    private contractService: ContractService,
    private invoiceService: InvoiceService,
    private openItemService: OpenItemService,
    private subscriptionService: SubscriptionService,
    private crmService: CrmService,
    private notificationService: NotificationService,
    private confirmationService: ConfirmationService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.checkMobile();
    const targetId = this.route.snapshot.queryParamMap.get('customerId');
    if (targetId) {
      this.loadPageAndSelect(targetId);
    } else {
      this.loadPage(0);
    }
  }

  private loadPageAndSelect(customerId: string): void {
    this.loadingCustomers = true;
    this.listError = null;
    this.customerService.getCustomersPaginated(0, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          this.customers = result.content;
          this.currentPage = result.currentPage;
          this.totalPages = result.totalPages;
          this.totalElements = result.totalElements;
          this.loadingCustomers = false;
          const found = this.customers.find(c => c.id === customerId);
          if (found) {
            this.onCustomerSelected(found);
          } else {
            this.customerService.getCustomerById(customerId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: customer => this.onCustomerSelected(customer),
                error: () => {}
              });
          }
        },
        error: err => {
          this.listError = err.error?.message || 'Fehler beim Laden der Kunden';
          this.loadingCustomers = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.unlockBodyScroll();
  }

  @HostListener('window:resize')
  onResize(): void { this.checkMobile(); }

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.isMobile && this.mobileView === 'detail') this.navigateBack(); }

  // ─── Mobile ───────────────────────────────────────────────────────────────
  private checkMobile(): void {
    const was = this.isMobile;
    this.isMobile = window.innerWidth <= 768;
    if (was !== this.isMobile) {
      if (this.isMobile) this.lockBodyScroll(); else this.unlockBodyScroll();
    }
  }
  navigateBack(): void { this.mobileView = 'list'; }
  private lockBodyScroll(): void {
    document.body.style.cssText = 'overflow:hidden;position:fixed;width:100%;height:100%';
    document.documentElement.style.overflow = 'hidden';
  }
  private unlockBodyScroll(): void {
    document.body.style.cssText = '';
    document.documentElement.style.overflow = '';
  }

  // ─── Paginierte Kundenliste ───────────────────────────────────────────────
  loadPage(page: number): void {
    this.loadingCustomers = true;
    this.listError = null;
    this.customerService.getCustomersPaginated(page, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          this.customers = result.content;
          this.currentPage = result.currentPage;
          this.totalPages = result.totalPages;
          this.totalElements = result.totalElements;
          this.loadingCustomers = false;
        },
        error: err => {
          this.listError = err.error?.message || 'Fehler beim Laden der Kunden';
          this.loadingCustomers = false;
        }
      });
  }

  onPageChange(page: number): void { this.loadPage(page); }

  // ─── Kundenauswahl → Detaildaten lazy laden ───────────────────────────────
  onCustomerSelected(customer: Customer): void {
    if (this.selectedCustomer?.id === customer.id && !this.isMobile) return;
    this.selectedCustomer = customer;
    this.clearDetail();
    this.loadDetailData(customer.id!);
    if (this.isMobile) this.mobileView = 'detail';
  }

  private clearDetail(): void {
    this.contracts = []; this.invoices = []; this.openItems = [];
    this.notes = []; this.activities = []; this.contacts = [];
    this.documents = []; this.contractSubscriptions = {};
  }

  private loadDetailData(customerId: string): void {
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

  // ─── Vertrag angeklickt → Abonnements lazy laden ─────────────────────────
  onContractExpanded(contractId: string): void {
    if (this.contractSubscriptions[contractId]) return; // schon geladen
    this.subscriptionService.getSubscriptionsByContract(contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: subs => { this.contractSubscriptions = { ...this.contractSubscriptions, [contractId]: subs }; },
        error: () => { this.contractSubscriptions = { ...this.contractSubscriptions, [contractId]: [] }; }
      });
  }

  // ─── CRM-Aktionen ─────────────────────────────────────────────────────────
  onNoteCreated(note: Partial<CrmNote>): void {
    if (!this.selectedCustomer?.id) return;
    this.crmService.createNote(note, this.selectedCustomer.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: c => { this.notes = [c, ...this.notes]; this.notificationService.success('Notiz erstellt'); },
        error: () => this.notificationService.error('Fehler beim Erstellen der Notiz')
      });
  }

  onNoteDeleted(id: string): void {
    this.confirmationService.confirm({
      message: 'Notiz wirklich löschen?', header: 'Notiz löschen',
      icon: 'pi pi-exclamation-triangle', acceptLabel: 'Löschen', rejectLabel: 'Abbrechen',
      accept: () => this.crmService.deleteNote(id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => { this.notes = this.notes.filter(n => n.id !== id); this.notificationService.success('Notiz gelöscht'); },
        error: () => this.notificationService.error('Fehler beim Löschen')
      })
    });
  }

  onActivityCreated(activity: Partial<CrmActivity>): void {
    if (!this.selectedCustomer?.id) return;
    this.crmService.createActivity(activity, this.selectedCustomer.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: c => { this.activities = [c, ...this.activities]; this.notificationService.success('Aktivität erstellt'); },
        error: () => this.notificationService.error('Fehler beim Erstellen der Aktivität')
      });
  }

  onActivityCompleted(id: string): void {
    this.crmService.completeActivity(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: u => {
        const i = this.activities.findIndex(a => a.id === id);
        if (i >= 0) { this.activities = [...this.activities]; this.activities[i] = u; }
        this.notificationService.success('Aktivität abgeschlossen');
      },
      error: () => this.notificationService.error('Fehler')
    });
  }

  onActivityDeleted(id: string): void {
    this.confirmationService.confirm({
      message: 'Aktivität löschen?', header: 'Aktivität löschen',
      icon: 'pi pi-exclamation-triangle', acceptLabel: 'Löschen', rejectLabel: 'Abbrechen',
      accept: () => this.crmService.deleteActivity(id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => { this.activities = this.activities.filter(a => a.id !== id); this.notificationService.success('Aktivität gelöscht'); },
        error: () => this.notificationService.error('Fehler')
      })
    });
  }

  onContactCreated(contact: Partial<CrmContact>): void {
    if (!this.selectedCustomer?.id) return;
    this.crmService.createContact(contact, this.selectedCustomer.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: c => { this.contacts = [...this.contacts, c]; this.notificationService.success('Ansprechpartner erstellt'); },
        error: () => this.notificationService.error('Fehler')
      });
  }

  onContactDeleted(id: string): void {
    this.confirmationService.confirm({
      message: 'Ansprechpartner löschen?', header: 'Ansprechpartner löschen',
      icon: 'pi pi-exclamation-triangle', acceptLabel: 'Löschen', rejectLabel: 'Abbrechen',
      accept: () => this.crmService.deleteContact(id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => { this.contacts = this.contacts.filter(c => c.id !== id); this.notificationService.success('Gelöscht'); },
        error: () => this.notificationService.error('Fehler')
      })
    });
  }

  onDocumentUploaded(payload: { file: File; documentType?: string; description?: string }): void {
    if (!this.selectedCustomer?.id) return;
    this.crmService.uploadDocument(payload.file, this.selectedCustomer.id, undefined, payload.documentType, payload.description)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: d => { this.documents = [d, ...this.documents]; this.notificationService.success('Dokument hochgeladen'); },
        error: () => this.notificationService.error('Fehler beim Hochladen')
      });
  }

  onDocumentDeleted(id: string): void {
    this.confirmationService.confirm({
      message: 'Dokument löschen?', header: 'Dokument löschen',
      icon: 'pi pi-exclamation-triangle', acceptLabel: 'Löschen', rejectLabel: 'Abbrechen',
      accept: () => this.crmService.deleteDocument(id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => { this.documents = this.documents.filter(d => d.id !== id); this.notificationService.success('Dokument gelöscht'); },
        error: () => this.notificationService.error('Fehler')
      })
    });
  }
}
