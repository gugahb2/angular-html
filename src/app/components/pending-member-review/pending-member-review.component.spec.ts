import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingMemberReviewComponent } from './pending-member-review.component';

describe('PendingMemberReviewComponent', () => {
  let component: PendingMemberReviewComponent;
  let fixture: ComponentFixture<PendingMemberReviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PendingMemberReviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PendingMemberReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
