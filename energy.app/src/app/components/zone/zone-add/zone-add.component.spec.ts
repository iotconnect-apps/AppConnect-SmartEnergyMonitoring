import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoneAddComponent } from './zone-add.component';

describe('ZoneAddComponent', () => {
  let component: ZoneAddComponent;
  let fixture: ComponentFixture<ZoneAddComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ZoneAddComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ZoneAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
