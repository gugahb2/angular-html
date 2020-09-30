import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../shared/services/auth.service';
import {ApiService} from '../../shared/services/api.service';

@Component({
    selector: 'app-new-meetings-group',
    templateUrl: './new-meetings-group.component.html',
    styleUrls: ['./new-meetings-group.component.scss']
})
export class NewMeetingsGroupComponent implements OnInit {

    constructor(
        public authService: AuthService,
        public apiService: ApiService
    ) {
    }


    cars = [
        {id: 1, name: 'Volvo'},
        {id: 2, name: 'Saab', disabled: true},
        {id: 3, name: 'Opel'},
        {id: 4, name: 'Audi'},
    ];

    model = {
        basic: '',
        container: '',
        required: '',
        cars: [3]
    };

    ngOnInit(): void {
    }

}
