import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialTabs } from './financial-tabs';

describe('FinancialTabs', () => {
  let component: FinancialTabs;
  let fixture: ComponentFixture<FinancialTabs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialTabs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialTabs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
