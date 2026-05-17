import { SortState } from './sort-state';

export abstract class ListBase<T> {
  sort = new SortState();
  loading = false;
  saving = false;
  error: string | null = null;
  searchTerm = '';
  showNewModal = false;
  showEditModal = false;

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
}
