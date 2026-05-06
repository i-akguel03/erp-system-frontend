export type SortDir = 'asc' | 'desc';

export class SortState {
  key: string | null = null;
  dir: SortDir = 'asc';

  toggle(key: string): void {
    if (this.key !== key) {
      this.key = key;
      this.dir = 'asc';
    } else if (this.dir === 'asc') {
      this.dir = 'desc';
    } else {
      this.key = null;
    }
  }

  /** Returns [ngClass] object for the sort icon <i> element. */
  icon(key: string): { [cls: string]: boolean } {
    const on = this.key === key;
    return {
      'fa-sort':      !on,
      'fa-sort-up':   on && this.dir === 'asc',
      'fa-sort-down': on && this.dir === 'desc',
      'text-primary': on,
      'opacity-25':   !on,
    };
  }

  active(key: string): boolean {
    return this.key === key;
  }
}
