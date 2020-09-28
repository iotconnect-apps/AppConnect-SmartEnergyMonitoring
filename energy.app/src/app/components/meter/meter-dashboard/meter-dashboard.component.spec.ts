import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MeterDashboardComponent } from './meter-dashboard.component';

describe('MeterDashboardComponent', () => {
  let component: MeterDashboardComponent;
  let fixture: ComponentFixture<MeterDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MeterDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MeterDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
