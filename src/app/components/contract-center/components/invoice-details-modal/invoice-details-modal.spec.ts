import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceDetailsModal } from './invoice-details-modal';

describe('InvoiceDetailsModal', () => {
  let component: InvoiceDetailsModal;
  let fixture: ComponentFixture<InvoiceDetailsModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceDetailsModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvoiceDetailsModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
