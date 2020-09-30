import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMeetupsComponent } from './add-meetups.component';

describe('AddMeetupsComponent', () => {
  let component: AddMeetupsComponent;
  let fixture: ComponentFixture<AddMeetupsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddMeetupsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddMeetupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
