import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenItemTab } from './open-item-tab';

describe('OpenItemTab', () => {
  let component: OpenItemTab;
  let fixture: ComponentFixture<OpenItemTab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpenItemTab]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpenItemTab);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
