import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DueScheduleTab } from './due-schedule-tab';

describe('DueScheduleTab', () => {
  let component: DueScheduleTab;
  let fixture: ComponentFixture<DueScheduleTab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DueScheduleTab]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DueScheduleTab);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
