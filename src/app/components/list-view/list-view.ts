import { Component, OnInit } from '@angular/core';
import { Address } from '../../models/Address';
import { Contract } from '../../models/Contract';
import { Customer } from '../../models/Customer';
import { Subscription } from '../../models/Subscription';
import { Product } from '../../models/Product';

type EntityType = 'customer' | 'address' | 'subscription' | 'product';

@Component({
  selector: 'app-list-view',
  templateUrl: './list-view.html',
  styleUrls: ['./list-view.scss']
})
export class ListViewComponent implements OnInit {

  entityType: EntityType = 'customer'; // aktuell aktive Liste
  searchTerm: string = '';
  loading = false;
  error: string | null = null;

  // Masterlisten
  customers: Customer[] = [];
  addresses: Address[] = [];
  subscriptions: Subscription[] = [];
  products: Product[] = [];
  contracts: Contract[] = [];

  // gefilterte Liste für die Anzeige
  filteredItems: any[] = [];

  // Modals
  showNewModal = false;
  showEditModal = false;
  editItem: any;
  newItem: any;

  ngOnInit(): void {
    this.loadItems();
  }

  /** Setzt die aktuell aktive Entity */
  setEntity(type: EntityType) {
    this.entityType = type;
    this.searchTerm = '';
    this.loadItems();
  }

  /** Lädt die Liste basierend auf entityType */
  loadItems() {
    this.loading = true;
    this.error = null;

    try {
      switch (this.entityType) {
        case 'customer':
          this.filteredItems = [...this.customers];
          break;
        case 'address':
          this.filteredItems = [...this.addresses];
          break;
        case 'subscription':
          this.filteredItems = [...this.subscriptions];
          break;
        case 'product':
          this.filteredItems = [...this.products];
          break;
      }
    } catch (e) {
      this.error = 'Fehler beim Laden der Daten';
    } finally {
      this.loading = false;
    }
  }

  /** Filterfunktion für Suche */
  filterItems() {
    const term = this.searchTerm.toLowerCase();

    switch (this.entityType) {
      case 'customer':
        this.filteredItems = this.customers.filter(c =>
          c.firstName.toLowerCase().includes(term) ||
          c.lastName.toLowerCase().includes(term) ||
          c.customerNumber?.toLowerCase().includes(term)
        );
        break;
      case 'address':
        this.filteredItems = this.addresses.filter(a =>
          a.street.toLowerCase().includes(term) ||
          a.city.toLowerCase().includes(term) ||
          a.postalCode.includes(term)
        );
        break;
      case 'subscription':
        this.filteredItems = this.subscriptions.filter(s =>
          s.productName?.toLowerCase().includes(term)
        );
        break;
      case 'product':
        this.filteredItems = this.products.filter(p =>
          p.name.toLowerCase().includes(term)
        );
        break;
    }
  }

  /** Öffnet Modal für neues Item */
  openNewModal() {
    this.showNewModal = true;
    this.newItem = this.createEmptyItem();
  }

  /** Öffnet Modal zum Bearbeiten */
  openEditModal(item: any) {
    this.showEditModal = true;
    this.editItem = { ...item };
  }

  /** Erstellt leeres Objekt basierend auf entityType */
  private createEmptyItem(): any {
    switch (this.entityType) {
      case 'customer': return { firstName: '', lastName: '', tel: '', residentialAddress: {} };
      case 'address': return { street: '', postalCode: '', city: '', country: '' };
      case 'subscription': return { productName: '', contractId: '', subscriptionStatus: 'ACTIVE', startDate: '', endDate: '' };
      case 'product': return { name: '', description: '', price: 0, unit: '', productType: '', active: true };
    }
  }

  /** Speichern eines neuen Items */
  createItem() {
    switch (this.entityType) {
      case 'customer': this.customers.push(this.newItem); break;
      case 'address': this.addresses.push(this.newItem); break;
      case 'subscription': this.subscriptions.push(this.newItem); break;
      case 'product': this.products.push(this.newItem); break;
    }
    this.showNewModal = false;
    this.loadItems();
  }

  /** Update eines Items */
  updateItem() {
    const list = this.getCurrentList();
    const index = list.findIndex(i => i.id === this.editItem.id);
    if (index !== -1) {
      list[index] = this.editItem;
    }
    this.showEditModal = false;
    this.loadItems();
  }

  /** Löschen */
  deleteItem(item: any) {
    const list = this.getCurrentList();
    const index = list.findIndex(i => i.id === item.id);
    if (index !== -1) list.splice(index, 1);
    this.loadItems();
  }

  /** Hilfsfunktion: Gibt die aktuelle Masterliste zurück */
  private getCurrentList(): any[] {
    switch (this.entityType) {
      case 'customer': return this.customers;
      case 'address': return this.addresses;
      case 'subscription': return this.subscriptions;
      case 'product': return this.products;
      default: return [];
    }
  }

  /** Für Subscriptions */
  getContractById(id: string) {
    return this.contracts.find(c => c.id === id);
  }

  getStatusBadgeClass(status: string) {
    switch (status) {
      case 'ACTIVE': return 'bg-success';
      case 'PAUSED': return 'bg-warning';
      case 'CANCELLED': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }
}
