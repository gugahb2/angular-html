import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../shared/services/auth.service';
import {Router} from '@angular/router';

@Component({
    selector: 'app-home-page',
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {

    hasUser = false;

    constructor(
        public authService: AuthService,
        public router: Router
    ) {
    }

    ngOnInit(): void {
        if (this.topDisplayName) { this.hasUser = true; }
    }

    socialMediaLogin(loginType) {
        switch (loginType) {
            case 'google': {this.authService.googleSignin({}); break; }
            case 'apple': {this.authService.appleSignin({}); break; }
            case 'facebook': {this.authService.facebookSignin({}); break; }
            }
        if (this.authService.isAuthenticated) {
                this.router.navigate(['/dashboard']);
        }
    }

    get displayName(): string {
        if(localStorage.getItem('loginType') && localStorage.getItem('loginType') === 'email'){
            return '';
        } else {
            return('Not ' + localStorage.getItem('displayName') + ' ?');
        }
    }

    get topDisplayName(): string {
        if(localStorage.getItem('loginType') && localStorage.getItem('loginType') === 'email'){
            return '';
        } else {
            return(localStorage.getItem('displayName'));
        }
    }

    get LoginType(): string {
        return localStorage.getItem('loginType');
    }

    RedirectToLogin(e) {
        e.preventDefault();
        localStorage.removeItem('loginType');
        localStorage.removeItem('displayName');
        // this.router.navigate(['sign-in']);
    }
}
