import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../shared/services/auth.service';
import {ApiService} from '../../shared/services/api.service';

@Component({
    selector: 'app-meetup-settings',
    templateUrl: './meetup-settings.component.html',
    styleUrls: ['./meetup-settings.component.scss']
})
export class MeetupSettingsComponent implements OnInit {
    status = false;

    constructor(
        public authService: AuthService,
        public apiService: ApiService
    ) {

    }

    QuestionPanel($event) {
        $event.preventDefault();
        this.status = true;
    }

    ngOnInit(): void {
    }

}
