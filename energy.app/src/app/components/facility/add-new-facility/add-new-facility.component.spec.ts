import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNewFacilityComponent } from './add-new-facility.component';

describe('AddNewFacilityComponent', () => {
  let component: AddNewFacilityComponent;
  let fixture: ComponentFixture<AddNewFacilityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddNewFacilityComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddNewFacilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
