import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AuthService} from '../../shared/services/auth.service';

@Component({
    selector: 'app-guest-login',
    templateUrl: './guest-login.component.html',
    styleUrls: ['./guest-login.component.scss']
})
export class GuestLoginComponent implements OnInit {
    id: string;

    constructor(
        public route: ActivatedRoute,
        private authService: AuthService
    ) {
        this.route.paramMap.subscribe(params => {
            this.id = params.get('id');
        });
    }

    ngOnInit(): void {
        console.log('guest login');
        //this.authService.GuestAuth();
    }
}
