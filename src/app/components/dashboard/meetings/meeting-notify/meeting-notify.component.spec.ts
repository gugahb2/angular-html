import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {MeetingNotifyComponent} from './meeting-notify.component';

describe('MeetingNotifyComponent', () => {
    let component: MeetingNotifyComponent;
    let fixture: ComponentFixture<MeetingNotifyComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [MeetingNotifyComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MeetingNotifyComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
