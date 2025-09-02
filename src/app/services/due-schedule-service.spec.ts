import { TestBed } from '@angular/core/testing';

import { DueScheduleService } from './due-schedule-service';

describe('DueScheduleService', () => {
  let service: DueScheduleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DueScheduleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
