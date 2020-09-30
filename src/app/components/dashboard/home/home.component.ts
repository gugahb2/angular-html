import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ApiService} from '../../../shared/services/api.service';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {AuthService} from '../../../shared/services/auth.service';
import * as moment from 'moment';
import { async } from '@angular/core/testing';
import { User } from 'firebase';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
    config = [];
    meetupId;
    meetup: any;
    userCollection: any;
    meetupRole: string;
    meetings: any;
    meetupList: any;
    firebaseUserSubscription: Subscription;

    constructor(
        public route: ActivatedRoute,
        private api: ApiService,
        public afs: AngularFirestore,
        private auth: AngularFireAuth,
        private router: Router,
        public authService: AuthService
    ) {
        this.route.paramMap.subscribe((params) => {
            this.meetupId = params.get('id');
        });
    }

    ngOnInit(): void {
        this.firebaseUserSubscription = this.authService.firebaseUser$.subscribe(firebaseUser => {
            if (firebaseUser &&
                firebaseUser.meetupSubscriptionSnapshots &&
                firebaseUser.meetupSubscriptionSnapshots.length > 0) {
                   this.meetupList = firebaseUser.meetupSubscriptionSnapshots;
                   this.meetup = firebaseUser.meetupSubscriptionSnapshots.find((m) => m.meetupId === this.meetupId);
                   if (this.meetup && this.meetup.role && this.meetup.role.length > 0) {
                       this.meetupRole = this.meetup.role[0];
                   }
                }
        });
    }

    GetUserMeetingList() {
        if (this.userCollection &&
            this.userCollection.meetingSubscriptionSnapshots &&
            this.userCollection.meetingSubscriptionSnapshots.length > 0 && this.meetupId) {
            const meetings = this.userCollection.meetingSubscriptionSnapshots;
            this.meetings = meetings.filter(meeting => {
                return meeting.meetupId === this.meetupId;
            });
        } else {
            this.meetings = [];
        }
    }

    JoinMeeting(e, meeting) {
        e.preventDefault();
        console.log(meeting);
    }

    InviteMeeting(e, meeting) {
        e.preventDefault();
        this.router.navigate([`/dashboard/meeting/${meeting.meetingId}/invite`]);
    }

    RedirectBack() {
    }

    async ChangeMeetup(m) {
        if (m.meetupId !== this.meetupId) {
            this.meetupId = m.meetupId;
            await this.router.navigateByUrl(`/dashboard/meetup/${m.meetupId}`);
            this.GetUserMeetingList();
        }
    }

    Date(date) {
        if (date && date.seconds) {
            const now = moment.unix(date.seconds);
            return now.format('MMMM Do, HH.mm A');
        }
        return null;
    }

    get HasAccessToMeetup(): boolean {
        return this.meetupList && this.meetupList.length > 0 && !!this.meetupList.find(m => m.meetupId === this.meetupId);
    }

    NavigateToJoin(e) {
        e.preventDefault();
        this.router.navigate([`/dashboard/meetup/${this.meetupId}/join`]);
    }
}
