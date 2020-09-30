import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinPublicMeetupsComponent } from './join-public-meetups.component';

describe('JoinPublicMeetupsComponent', () => {
  let component: JoinPublicMeetupsComponent;
  let fixture: ComponentFixture<JoinPublicMeetupsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JoinPublicMeetupsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JoinPublicMeetupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
