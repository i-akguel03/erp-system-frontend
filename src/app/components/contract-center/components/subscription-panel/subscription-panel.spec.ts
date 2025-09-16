import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriptionPanel } from './subscription-panel';

describe('SubscriptionPanel', () => {
  let component: SubscriptionPanel;
  let fixture: ComponentFixture<SubscriptionPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubscriptionPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubscriptionPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
