import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriptionList } from './subscription-list';

describe('SubscriptionList', () => {
  let component: SubscriptionList;
  let fixture: ComponentFixture<SubscriptionList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubscriptionList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubscriptionList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
