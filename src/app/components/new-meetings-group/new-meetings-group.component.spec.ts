import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewMeetingsGroupComponent } from './new-meetings-group.component';

describe('NewMeetingsGroupComponent', () => {
  let component: NewMeetingsGroupComponent;
  let fixture: ComponentFixture<NewMeetingsGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewMeetingsGroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewMeetingsGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
