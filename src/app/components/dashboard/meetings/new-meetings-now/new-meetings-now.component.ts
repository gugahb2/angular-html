import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../../../shared/services/auth.service';
import {ApiService} from '../../../../shared/services/api.service';
import {FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
    selector: 'app-new-meetings-now',
    templateUrl: './new-meetings-now.component.html',
    styleUrls: ['./new-meetings-now.component.scss']
})
export class NewMeetingsNowComponent implements OnInit {

    constructor(
        public authService: AuthService,
        public apiService: ApiService
    ) {
    }

    status = false;
    FilterStatus = false;
    config = [];
    meetingForm = new FormGroup({
        name: new FormControl('', Validators.required),
        people: new FormControl('group'),
        allowGuests: new FormControl(false),
        date: new FormControl('now'),
        dateValues: new FormGroup({
            start: new FormControl(''),
            end: new FormControl(''),
            recurring: new FormControl(false),
            // timezone: new FormControl('')
        }),
        addAttachments: new FormControl(false),
        recordMeeting: new FormControl(false),
        hostUid: new FormControl(''),
        meetupId: new FormControl('')
    });

    QuestionPanel($event) {
        $event.preventDefault();
        this.status = true;
    }

    FilterPanel($event) {
        $event.preventDefault();
        this.FilterStatus = true;
    }

    ngOnInit(): void {
        this.meetingForm.patchValue(
            {
                hostUid: this.apiService.user.uid,
                meetupId: localStorage.getItem('meetupId') || null
            }
        );
    }

    CreateMeetingRequest() {
        if (this.meetingForm.invalid) {
            return;
        }
        this.apiService.CreateMeeting(this.meetingForm.value);
    }

}
