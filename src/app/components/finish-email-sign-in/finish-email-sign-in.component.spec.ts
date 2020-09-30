import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FinishEmailSignInComponent } from './finish-email-sign-in.component';

describe('FinishEmailSignInComponent', () => {
  let component: FinishEmailSignInComponent;
  let fixture: ComponentFixture<FinishEmailSignInComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FinishEmailSignInComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FinishEmailSignInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
