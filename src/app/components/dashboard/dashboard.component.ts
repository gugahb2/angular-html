import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../shared/services/auth.service';
import {Router, ActivatedRoute} from '@angular/router';
import {ApiService} from '../../shared/services/api.service';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
import {UserService} from '../../shared/services/user.service';
import {DataService} from '../../shared/services/data.service';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
    meetups: any;
    currentMeetup: any;
    userCollection: any;
    showSecureAccountPopup: boolean;

    constructor(
        public authService: AuthService,
        public router: Router,
        private route: ActivatedRoute,
        private auth: AngularFireAuth,
        public afs: AngularFirestore,
        private userService: UserService,
        private data: DataService
    ) {

    }

    ngOnInit(): void {
    }

    /**
     * If the current user is a guest and not joined any meetups
     * and the current url is at meetup, then redirect to meeting page
     */
    private HandleGuestRedirect() {
        if (this.userCollection && this.userCollection.isAnonymous &&
            (!this.userCollection.meetupSubscriptionSnapshots ||
                this.userCollection.meetupSubscriptionSnapshots.length < 0) &&
            !this.router.url.includes('/dashboard/meetup/')
        ) {
            this.router.navigate(['/dashboard/meetings']);
        }
    }

    SetMeetupData() {
        if (
            this.userCollection &&
            this.userCollection.hasOwnProperty('meetupSubscriptionSnapshots') &&
            this.userCollection.meetupSubscriptionSnapshots.length > 0
        ) {
            this.meetups = this.userCollection.meetupSubscriptionSnapshots;
            const meetupId = localStorage.getItem('meetupId');
            if (meetupId) {
                this.currentMeetup = this.meetups.find((m) => m.meetupId === meetupId);
            } else {
                this.currentMeetup = this.meetups[0];
                localStorage.setItem('meetupId', this.currentMeetup.meetupId);
            }

            // this.data.UpdateMeetup(this.currentMeetup.meetupId);
        }
    }

    RedirectToMeetup(m) {
        localStorage.setItem('meetupId', m.meetupId);
        this.currentMeetup = this.meetups.find((meetup) => meetup.meetupId === m.meetupId);
        // this.data.UpdateMeetup(m.meetupId);
    }

    ShowSecureYourAccountPopup(e) {
        e.preventDefault();
        this.showSecureAccountPopup = true;
    }

    ClosePopup() {
        this.showSecureAccountPopup = false;
    }
}
