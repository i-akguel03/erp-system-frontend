import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VorgangList } from './vorgang-list';

describe('VorgangList', () => {
  let component: VorgangList;
  let fixture: ComponentFixture<VorgangList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VorgangList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VorgangList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
