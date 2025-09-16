import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceTab } from './invoice-tab';

describe('InvoiceTab', () => {
  let component: InvoiceTab;
  let fixture: ComponentFixture<InvoiceTab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceTab]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvoiceTab);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
