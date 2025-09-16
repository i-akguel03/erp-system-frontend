import { TestBed } from '@angular/core/testing';

import { OpenItemService } from './open-item-service';

describe('OpenItemService', () => {
  let service: OpenItemService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpenItemService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
