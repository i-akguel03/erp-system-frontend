import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product-service';
import { Product } from '../../models/Product';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.scss'],
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  loading = false;
  error: string | null = null;
  searchTerm: string = '';

  newProduct: Product = this.createEmptyProduct();
  editProduct: Product = this.createEmptyProduct();

  showNewModal = false;
  showEditModal = false;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  // --- Load ---
  loadProducts(): void {
    this.loading = true;
    this.error = null;
    this.productService.getProducts().subscribe({
      next: data => {
        this.products = data;
        this.filteredProducts = [...this.products];
        this.loading = false;
      },
      error: err => this.handleApiError(err, 'Fehler beim Laden der Produkte')
    });
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
    if (!id || !confirm('Möchten Sie dieses Produkt wirklich löschen?')) return;
    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.products = this.products.filter(p => p.id !== id);
        this.filterProducts();
      },
      error: err => this.handleApiError(err, 'Fehler beim Löschen des Produkts')
    });
  }

  // --- Modal ---
  openNewModal(): void { this.showNewModal = true; this.newProduct = this.createEmptyProduct(); this.error = null; }
  closeNewModal(): void { this.showNewModal = false; }

  openEditModal(product: Product): void { this.editProduct = { ...product }; this.showEditModal = true; this.error = null; }
  closeEditModal(): void { this.showEditModal = false; }

  // --- CRUD ---
  createProduct(): void {
    this.productService.createProduct(this.newProduct).subscribe({
      next: created => { this.products.push(created); this.filteredProducts = [...this.products]; this.closeNewModal(); },
      error: err => this.handleApiError(err, 'Fehler beim Erstellen des Produkts')
    });
  }

  updateProduct(): void {
    if (!this.editProduct.id) return;
    this.productService.updateProduct(this.editProduct.id, this.editProduct).subscribe({
      next: updated => {
        const index = this.products.findIndex(p => p.id === updated.id);
        if (index >= 0) this.products[index] = updated;
        this.filteredProducts = [...this.products];
        this.closeEditModal();
      },
      error: err => this.handleApiError(err, 'Fehler beim Aktualisieren des Produkts')
    });
  }

  // --- Helpers ---
  private handleApiError(err: any, defaultMessage: string): void {
    console.error('API Error:', err);
    this.loading = false;
    this.error = err.error?.message || defaultMessage;
  }

  private createEmptyProduct(): Product {
    return { name: '', description: '', price: 0, unit: '', taxRate: 0, productType: '', active: true };
  }
}
