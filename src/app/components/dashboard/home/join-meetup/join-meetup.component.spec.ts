import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinMeetupComponent } from './join-meetup.component';

describe('JoinMeetupComponent', () => {
  let component: JoinMeetupComponent;
  let fixture: ComponentFixture<JoinMeetupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JoinMeetupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JoinMeetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
