import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewMeetingsScheduledComponent } from './new-meetings-scheduled.component';

describe('NewMeetingsScheduledComponent', () => {
  let component: NewMeetingsScheduledComponent;
  let fixture: ComponentFixture<NewMeetingsScheduledComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewMeetingsScheduledComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewMeetingsScheduledComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
