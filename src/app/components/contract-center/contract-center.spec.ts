import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractCenter } from './contract-center';

describe('ContractCenter', () => {
  let component: ContractCenter;
  let fixture: ComponentFixture<ContractCenter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractCenter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContractCenter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
