import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../shared/services/auth.service';
import {ApiService} from '../../shared/services/api.service';

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

    ngOnInit(): void {
    }

}
