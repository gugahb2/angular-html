import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OmSettingsComponent } from './om-settings.component';

describe('OmSettingsComponent', () => {
  let component: OmSettingsComponent;
  let fixture: ComponentFixture<OmSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OmSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OmSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
