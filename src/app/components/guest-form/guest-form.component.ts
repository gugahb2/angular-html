import {Component, NgZone, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AuthService} from '../../shared/services/auth.service';
import {AngularFireFunctions} from '@angular/fire/functions';
import {AngularFireAuth} from '@angular/fire/auth';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
    selector: 'app-guest-form',
    templateUrl: './guest-form.component.html',
    styleUrls: ['./guest-form.component.scss']
})
export class GuestFormComponent implements OnInit {
    joinForm: FormGroup;
    meetingId: string;
    meetingCollection: any;

    constructor(
        public authService: AuthService,
        private fns: AngularFireFunctions,
        private auth: AngularFireAuth,
        public http: HttpClient,
        public ngZone: NgZone,
        public router: Router,
        private route: ActivatedRoute,
    ) {
        // get the meeting id from the url parameter
        route.params.subscribe(params => {
            if (params.id) {
                this.meetingId = params.id;
                // get the meeting
                this.GetMeeting();
            }
        });
    }

    ngOnInit(): void {
        // generate form
        this.joinForm = new FormGroup({
            displayName: new FormControl('', Validators.required),
            email: new FormControl('', Validators.required),
            invitedBy: new FormControl('', Validators.required),
        });
    }

    /**
     * Get the meeting from collection
     * This call not require authentication
     */
    GetMeeting() {
        if (this.meetingId) {
            const apiUri = `https://us-central1-online-meetups-e955d.cloudfunctions.net/api/meetinguuids/${this.meetingId}`;
            const headers = {
                'Content-Type': 'application/json'
            };
            this.http.get<any>(apiUri, {headers}).subscribe(data => {
                if (data && data.uuid) {
                    this.meetingCollection = data;
                }
            });
        }
    }

    /**
     * Formatted date
     */
    get MeetingDate(): string {
        if (this.meetingCollection && this.meetingCollection.dateValues && this.meetingCollection.dateValues.start) {
            const d = new Date(this.meetingCollection.dateValues.start);
            const ye = new Intl.DateTimeFormat('en', {year: 'numeric'}).format(d);
            const mo = new Intl.DateTimeFormat('en', {month: 'short'}).format(d);
            const da = new Intl.DateTimeFormat('en', {day: '2-digit'}).format(d);
            return `${mo} ${da} ${ye}`;
        }
        return null;
    }

    /**
     * On submit form
     * If the form is valid, then create firebase user and then user collection with form data
     * Redirect after user collection creation
     */
    async SubmitForm() {
        if (this.joinForm.invalid) {
            return;
        }
        // form data
        const data = {...this.joinForm.value, securityQnA: {}};
        // user collection create api
        const apiUri = 'https://us-central1-online-meetups-e955d.cloudfunctions.net/api/anonymoususers';
        // create firebase user
        const user = await this.CreateFirebaseUser();
        // check if authenticated
        this.auth.idToken.subscribe(token => {
            if (token) {
                const headers = {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + token,
                    responseType: 'text'
                };
                // create user collection using the auth token
                this.http.post<any>(apiUri, data, {headers, responseType: 'text' as 'json'}).subscribe(response => {
                    // redirect
                    this.RedirectAfterJoin(user);
                }, error => {
                    console.error(error);
                });
            }
        });
    }

    /**
     * Use firebase anonymous user creation to create user
     */
    async CreateFirebaseUser() {
        const response = await this.auth.signInAnonymously();
        if (response.user) {
            return response.user;
        }
        return false;
    }

    /**
     * Set the auth details in local storage
     * Redirect to the meeting page
     */
    RedirectAfterJoin(user) {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('isAuth', 'true');
        localStorage.setItem('closed', 'false');
        this.ngZone.run(() => {
            setTimeout(() => {
                this.router.navigate([`dashboard/meetings`]);
            }, 100);
        });
    }

    /**
     * Redirect to sign in page
     */
    async RedirectToSignIn(e) {
        e.preventDefault();
        await this.router.navigate([`/sign-in`, {id: this.meetingId}]);
    }
}
