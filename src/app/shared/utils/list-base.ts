import { SortState } from './sort-state';

export abstract class ListBase<T> {
  sort = new SortState();
  loading = false;
  saving = false;
  error: string | null = null;
  searchTerm = '';
  showNewModal = false;
  showEditModal = false;

  // Pagination state — used by all paginated lists
  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;

  clearError(): void {
    this.error = null;
  }

  protected handleApiError(err: any, defaultMessage: string): void {
    console.error('API Error:', err);
    this.loading = false;
    this.saving = false;
    this.error = err.error?.message || defaultMessage;
  }

  openNewModal(): void {
    this.showNewModal = true;
    this.error = null;
  }

  closeNewModal(): void {
    this.showNewModal = false;
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

  protected abstract loadPage(): void;

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadPage();
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadPage();
  }

  getPageNumbers(): number[] {
    const start = Math.max(0, this.currentPage - 2);
    const end = Math.min(this.totalPages - 1, this.currentPage + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
}
