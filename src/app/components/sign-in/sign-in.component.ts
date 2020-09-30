import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../shared/services/auth.service';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';

@Component({
    selector: 'app-sign-in',
    templateUrl: './sign-in.component.html',
    styleUrls: ['./sign-in.component.scss'],
})
export class SignInComponent implements OnInit {
    meetingId: string;
    meetingCollection: any;

    constructor(
        public authService: AuthService,
        private route: ActivatedRoute,
        private router: Router,
        private http: HttpClient,
    ) {
        // get the params if any
        route.params.subscribe(params => {
            if (params.id) {
                this.meetingId = params.id;
                localStorage.setItem('meetingUuid', params.id);
                // if meeting id is present, then fetch the meeting collection
                this.fetchMeetingCollection();
            }
        });
    }

    ngOnInit(): void {

    }

    /**
     * Fetch the meeting collection
     */
    fetchMeetingCollection() {
        const apiUri = `https://us-central1-online-meetups-e955d.cloudfunctions.net/api/meetinguuids/${this.meetingId}`;
        const headers = {
            'Content-Type': 'application/json',
        };
        this.http.get<any>(apiUri, {headers}).subscribe(data => {
            if (data && data.uuid) {
                this.meetingCollection = data;
            }
        });
    }

    /**
     * Redirect to guest login
     */
    GuestLogin() {
        if (this.meetingId) {
            this.router.navigate([`/guest/${this.meetingId}/form`]);
        }
    }

    /**
     * If the guest login option needs to show or not
     * Check if meeting id is present, then show
     */
    get ShowGuestLogin(): boolean {
        return !!this.meetingId;
    }

    /**
     * Get the meeting date in format
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
}
