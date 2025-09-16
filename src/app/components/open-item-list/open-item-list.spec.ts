import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenItemList } from './open-item-list';

describe('OpenItemList', () => {
  let component: OpenItemList;
  let fixture: ComponentFixture<OpenItemList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpenItemList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpenItemList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
