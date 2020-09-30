import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicMeetupsComponent } from './public-meetups.component';

describe('PublicMeetupsComponent', () => {
  let component: PublicMeetupsComponent;
  let fixture: ComponentFixture<PublicMeetupsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PublicMeetupsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PublicMeetupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
