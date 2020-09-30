import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../shared/services/auth.service';
import {ApiService} from '../../shared/services/api.service';

@Component({
    selector: 'app-dashboard-settings',
    templateUrl: './dashboard-settings.component.html',
    styleUrls: ['./dashboard-settings.component.scss']
})
export class DashboardSettingsComponent implements OnInit {

    constructor(
        public authService: AuthService,
        public apiService: ApiService
    ) {

    }

    status: boolean = false;

    questionPaenl($event) {
        $event.preventDefault();
        this.status = true;
    }

    ngOnInit(): void {
    }

}
