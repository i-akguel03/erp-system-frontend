import { Pipe, PipeTransform } from '@angular/core';
import { SortDir } from '../utils/sort-state';

@Pipe({ name: 'sort', standalone: true, pure: false })
export class SortPipe implements PipeTransform {
  transform<T>(items: T[], key: string | null, dir: SortDir = 'asc'): T[] {
    if (!items?.length || !key) return items;
    return [...items].sort((a, b) => {
      const av = this.get(a, key);
      const bv = this.get(b, key);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = String(av).localeCompare(String(bv), 'de', { numeric: true, sensitivity: 'base' });
      return dir === 'asc' ? cmp : -cmp;
    });
  }

  private get(obj: any, key: string): any {
    return key.split('.').reduce((o, k) => o?.[k], obj);
  }
}
