import { TestBed } from '@angular/core/testing';

import { VorgangService } from './vorgang-service';

describe('VorgangService', () => {
  let service: VorgangService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VorgangService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
