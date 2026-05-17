import { Component, Input, Output, EventEmitter, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, switchMap, takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { Address } from '../../../models/Address';
import { AddressService } from '../../../services/address-service';

@Component({
  selector: 'app-address-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="position-relative">

      <!-- Suchfeld -->
      <div class="form-floating">
        <input
          #searchInput
          type="text"
          class="form-control"
          [class.border-success]="!!selected"
          [id]="id"
          placeholder=" "
          [(ngModel)]="searchText"
          (ngModelChange)="onSearchChange($event)"
          (blur)="onBlur()"
          autocomplete="off">
        <label [for]="id">
          <i class="fas fa-map-marker-alt me-1 text-muted" style="font-size:0.8em"></i>{{ label }}
        </label>
      </div>

      <!-- Dropdown — fixed, außerhalb Modal-Overflow -->
      <div *ngIf="showDropdown"
           class="bg-white border rounded-3 shadow"
           [style.position]="'fixed'"
           [style.top]="dropdownTop"
           [style.left]="dropdownLeft"
           [style.width]="dropdownWidth"
           [style.z-index]="'9999'"
           [style.max-height]="'220px'"
           [style.overflow-y]="'auto'">

        <div *ngIf="loading" class="px-3 py-2 text-muted small d-flex align-items-center gap-2">
          <span class="spinner-border spinner-border-sm"></span>Suche läuft...
        </div>

        <ng-container *ngIf="!loading">
          <button *ngFor="let addr of results"
                  type="button"
                  class="dropdown-item px-3 py-2"
                  (mousedown)="selectAddress(addr)">
            <div class="fw-medium" style="font-size:0.875rem">{{ addr.street }}</div>
            <div class="text-muted" style="font-size:0.75rem">
              {{ addr.postalCode }} {{ addr.city }}<span *ngIf="addr.country">, {{ addr.country }}</span>
            </div>
          </button>
          <div *ngIf="results.length === 0 && searched" class="px-3 py-2 text-muted small">
            Keine Adressen gefunden
          </div>
        </ng-container>
      </div>

      <!-- Ausgewählte Adresse -->
      <div *ngIf="selected && !showDropdown" class="d-flex align-items-center gap-2 mt-1 px-1">
        <i class="fas fa-check-circle text-success" style="font-size:0.8rem"></i>
        <small class="text-muted flex-grow-1">{{ selected.postalCode }} {{ selected.city }}<span *ngIf="selected.country">, {{ selected.country }}</span></small>
        <button type="button" class="btn btn-link btn-sm text-danger p-0 lh-1" (click)="clearAddress()" title="Adresse entfernen">
          <i class="fas fa-times" style="font-size:0.8rem"></i>
        </button>
      </div>

    </div>
  `
})
export class AddressAutocompleteComponent implements OnDestroy {
  @ViewChild('searchInput') inputRef!: ElementRef<HTMLInputElement>;

  @Input() label = 'Adresse suchen...';
  @Input() id = 'addrSearch';

  @Input()
  get address(): Address | undefined { return this.selected; }
  set address(val: Address | undefined) {
    this.selected = val && val.street ? val : undefined;
    this.searchText = this.selected ? `${this.selected.street}, ${this.selected.postalCode} ${this.selected.city}` : '';
  }
  @Output() addressChange = new EventEmitter<Address | undefined>();

  selected?: Address;
  searchText = '';
  results: Address[] = [];
  showDropdown = false;
  loading = false;
  searched = false;

  dropdownTop = '0px';
  dropdownLeft = '0px';
  dropdownWidth = '0px';

  private searchInput$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private addressService: AddressService) {
    this.searchInput$.pipe(
      debounceTime(300),
      switchMap(q =>
        this.addressService.searchAddresses(q).pipe(
          catchError(() => { this.searched = true; return of([]); })
        )
      ),
      takeUntil(this.destroy$)
    ).subscribe(res => { this.results = res; this.loading = false; this.searched = true; });
  }

  private updateDropdownPosition(): void {
    const input = this.inputRef?.nativeElement;
    if (!input) return;
    const inputRect = input.getBoundingClientRect();

    // PrimeNG-Dialoge können transform/will-change setzen und damit einen
    // neuen Containing Block für position:fixed erzeugen.
    // Probe-Element misst den tatsächlichen Offset dieses Blocks.
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;pointer-events:none;';
    input.parentElement!.appendChild(probe);
    const probeRect = probe.getBoundingClientRect();
    input.parentElement!.removeChild(probe);

    this.dropdownTop = `${inputRect.bottom - probeRect.top + 3}px`;
    this.dropdownLeft = `${inputRect.left - probeRect.left}px`;
    this.dropdownWidth = `${inputRect.width}px`;
  }

  onSearchChange(val: string): void {
    if (this.selected) {
      this.selected = undefined;
    }
    if (val.length >= 3) {
      this.loading = true;
      this.searched = false;
      this.updateDropdownPosition();
      this.showDropdown = true;
      this.searchInput$.next(val);
    } else {
      this.showDropdown = false;
      this.results = [];
      this.searched = false;
    }
  }

  selectAddress(addr: Address): void {
    this.selected = addr;
    this.searchText = `${addr.street}, ${addr.postalCode} ${addr.city}`;
    this.showDropdown = false;
    this.addressChange.emit(addr);
  }

  clearAddress(): void {
    this.selected = undefined;
    this.searchText = '';
    this.results = [];
    this.showDropdown = false;
    this.searched = false;
    this.addressChange.emit(undefined);
  }

  onBlur(): void {
    if (!this.selected) {
      if (this.searchText.trim()) {
        this.searchText = '';
      }
      this.addressChange.emit(undefined);
    }
    setTimeout(() => { this.showDropdown = false; }, 200);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
