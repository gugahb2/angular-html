import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewMeetingsNowComponent } from './new-meetings-now.component';

describe('NewMeetingsNowComponent', () => {
  let component: NewMeetingsNowComponent;
  let fixture: ComponentFixture<NewMeetingsNowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewMeetingsNowComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewMeetingsNowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
