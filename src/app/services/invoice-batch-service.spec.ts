import { TestBed } from '@angular/core/testing';

import { InvoiceBatchService } from './invoice-batch-service';

describe('InvoiceBatchService', () => {
  let service: InvoiceBatchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InvoiceBatchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
