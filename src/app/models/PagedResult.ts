export interface PagedResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}
