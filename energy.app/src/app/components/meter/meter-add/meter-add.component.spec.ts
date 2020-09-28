import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SensorAddComponent } from './sensor-add.component';

describe('SensorAddComponent', () => {
  let component: SensorAddComponent;
  let fixture: ComponentFixture<SensorAddComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SensorAddComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SensorAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
