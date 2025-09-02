import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleList } from './schedule-list';

describe('ScheduleList', () => {
  let component: ScheduleList;
  let fixture: ComponentFixture<ScheduleList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduleList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
