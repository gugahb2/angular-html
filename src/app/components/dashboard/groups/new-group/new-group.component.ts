import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../../../shared/services/auth.service';
import {ApiService} from '../../../../shared/services/api.service';

@Component({
    selector: 'app-new-group',
    templateUrl: './new-group.component.html',
    styleUrls: ['./new-group.component.scss'],
})
export class NewGroupComponent implements OnInit {
    status = false;
    FilterStatus = false;
    config = [];

    constructor(public authService: AuthService, public apiService: ApiService) {
    }

    ngOnInit(): void {
    }

    QuestionPanel($event) {
        $event.preventDefault();
        this.status = true;
    }

    FilterPanel($event) {
        $event.preventDefault();
        this.FilterStatus = true;
    }
}
