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
    templateUrl: './add-meetups.component.html',
    styleUrls: ['./add-meetups.component.scss'],
})
export class AddMeetupsComponent implements OnInit {

    firebaseUserSubscription: Subscription;

    constructor(
        public router: Router,
        private api: ApiService,
        private auth: AngularFireAuth,
        private afs: AngularFirestore,
        public authService: AuthService
    ) {

    }

    ngOnInit(): void {
        this.firebaseUserSubscription = this.authService.firebaseUser$.subscribe(firebaseUser => {
            if (firebaseUser &&
                firebaseUser.meetupSubscriptionSnapshots &&
                firebaseUser.meetupSubscriptionSnapshots.length > 0) {
                   console.log(firebaseUser);
                   this.router.navigate([`dashboard/meetup/${firebaseUser.meetupSubscriptionSnapshots[0].meetupId}`]);
               }
        });
    }

    ngOnDestroy(): void {
        this.firebaseUserSubscription.unsubscribe();
    }
}
