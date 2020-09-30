import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../shared/services/auth.service';

@Component({
    selector: 'app-finish-email-sign-in',
    templateUrl: './finish-email-sign-in.component.html',
    styleUrls: ['./finish-email-sign-in.component.scss']
})
export class FinishEmailSignInComponent implements OnInit {

    constructor(
        public authService: AuthService
    ) {
    }


    ngOnInit(): void {
        this.authService.EmailAuthCallback();
    }

}
