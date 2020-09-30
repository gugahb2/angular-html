import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadMeetupsOnAppLoad } from './load-meetups-on-app-load.component';

describe('LoadMeetupsOnAppLoadComponent', () => {
  let component: LoadMeetupsOnAppLoad;
  let fixture: ComponentFixture<LoadMeetupsOnAppLoad>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoadMeetupsOnAppLoad ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoadMeetupsOnAppLoad);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
