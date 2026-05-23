import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SortPipe } from '../../shared/pipes/sort.pipe';
import { ListBase } from '../../shared/utils/list-base';
import { ListToolbarComponent } from '../../shared/components/list-toolbar/list-toolbar.component';
import { ListStatusComponent } from '../../shared/components/list-status/list-status.component';
import { ProductService } from '../../services/product-service';
import { Product } from '../../models/Product';
import { ConfirmationService } from 'primeng/api';
import { NotificationService } from '../../services/notification.service';
import { Dialog } from 'primeng/dialog';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, Dialog, SortPipe, ListToolbarComponent, ListStatusComponent],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.scss'],
})
export class ProductListComponent extends ListBase<Product> implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];

  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;

  newProduct: Product = this.createEmptyProduct();
  editProduct: Product = this.createEmptyProduct();

  constructor(
    private productService: ProductService,
    private confirmationService: ConfirmationService,
    private notification: NotificationService
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = null;
    this.productService.getProductsPaginated(this.currentPage, this.pageSize).subscribe({
      next: result => {
        this.products = result.content;
        this.filteredProducts = [...this.products];
        this.totalElements = result.totalElements;
        this.totalPages = result.totalPages;
        this.currentPage = result.currentPage;
        this.loading = false;
      },
      error: err => this.handleApiError(err, 'Fehler beim Laden der Produkte')
    });
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadProducts();
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadProducts();
  }

  getPageNumbers(): number[] {
    const start = Math.max(0, this.currentPage - 2);
    const end = Math.min(this.totalPages - 1, this.currentPage + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  filterProducts(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredProducts = this.products.filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.productNumber?.toLowerCase().includes(term)) ||
      (p.description?.toLowerCase().includes(term))
    );
  }

  deleteProduct(id?: string): void {
    if (!id) return;
    this.confirmationService.confirm({
      message: 'Möchten Sie dieses Produkt wirklich löschen?',
      header: 'Produkt löschen',
      icon: 'pi pi-trash',
      acceptLabel: 'Löschen',
      rejectLabel: 'Abbrechen',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.productService.deleteProduct(id).subscribe({
          next: () => {
            this.products = this.products.filter(p => p.id !== id);
            this.filterProducts();
            this.notification.success('Produkt wurde erfolgreich gelöscht.');
          },
          error: err => this.handleApiError(err, 'Fehler beim Löschen des Produkts')
        });
      }
    });
  }

  override openNewModal(): void {
    super.openNewModal();
    this.newProduct = this.createEmptyProduct();
  }

  openEditModal(product: Product): void {
    this.editProduct = { ...product };
    this.showEditModal = true;
    this.error = null;
  }

  createProduct(): void {
    if (this.saving) return;
    this.saving = true;
    this.productService.createProduct(this.newProduct).subscribe({
      next: created => {
        this.products.push(created);
        this.filteredProducts = [...this.products];
        this.saving = false;
        this.closeNewModal();
        this.notification.success('Produkt wurde erfolgreich erstellt.');
      },
      error: err => this.handleApiError(err, 'Fehler beim Erstellen des Produkts')
    });
  }

  updateProduct(): void {
    if (!this.editProduct.id || this.saving) return;
    this.saving = true;
    this.productService.updateProduct(this.editProduct.id, this.editProduct).subscribe({
      next: updated => {
        const index = this.products.findIndex(p => p.id === updated.id);
        if (index >= 0) this.products[index] = updated;
        this.filteredProducts = [...this.products];
        this.saving = false;
        this.closeEditModal();
        this.notification.success('Produkt wurde erfolgreich aktualisiert.');
      },
      error: err => this.handleApiError(err, 'Fehler beim Aktualisieren des Produkts')
    });
  }

  private createEmptyProduct(): Product {
    return { name: '', description: '', price: 0, unit: '', taxRate: 0, productType: '', active: true };
  }
}
