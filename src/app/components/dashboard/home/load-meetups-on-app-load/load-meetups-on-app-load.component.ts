import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {ApiService} from '../../../../shared/services/api.service';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
import {AuthService} from '../../../../shared/services/auth.service';
import { take, tap, map } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-add-meetups',
    templateUrl: './load-meetups-on-app-load.component.html',
    styleUrls: ['./load-meetups-on-app-load.component.scss'],
})
export class LoadMeetupsOnAppLoad implements OnInit {

    loggedInUserFromAuthServiceSubscription: Subscription;

    constructor(
        public router: Router,
        private api: ApiService,
        private auth: AngularFireAuth,
        private afs: AngularFirestore,
        public authService: AuthService
    ) {

    }

    ngOnInit(): void {
        this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(firebaseUser => {
            if (firebaseUser &&
                firebaseUser.meetupSubscriptionSnapshots &&
                firebaseUser.meetupSubscriptionSnapshots.length > 0) {
                    if(firebaseUser.lastMeetupInContextId){
                      if(firebaseUser.meetupSubscriptionSnapshots.some(meetup => meetup.meetupId === firebaseUser.lastMeetupInContextId)){
                          this.router.navigate([`dashboard/meetup/${firebaseUser.lastMeetupInContextId}`]);
                      }
                    } else {
                        this.router.navigate([`dashboard/meetup/${firebaseUser.meetupSubscriptionSnapshots[0].meetupId}`]);
                    }
                   //console.log(firebaseUser);
               }
        });
    }

    ngOnDestroy(): void {
        this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    }
}
