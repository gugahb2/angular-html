import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {AddNewMeetup} from './add-new-meetup.component';

describe('MeetupSettingsComponent', () => {
    let component: AddNewMeetup;
    let fixture: ComponentFixture<AddNewMeetup>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AddNewMeetup]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddNewMeetup);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
