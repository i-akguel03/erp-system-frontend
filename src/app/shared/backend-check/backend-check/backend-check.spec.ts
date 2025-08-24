import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackendCheck } from './backend-check';

describe('BackendCheck', () => {
  let component: BackendCheck;
  let fixture: ComponentFixture<BackendCheck>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackendCheck]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackendCheck);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
