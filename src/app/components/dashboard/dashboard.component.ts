import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../shared/services/auth.service';
import {Router, ActivatedRoute} from '@angular/router';
import {ApiService} from '../../shared/services/api.service';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
import {UserService} from '../../shared/services/user.service';
import {DataService} from '../../shared/services/data.service';
import {MeetupInContextService} from "../../shared/services/meetup-in-context.service";
import {Observable, Subscription} from "rxjs";
import {PresenceService} from "../../shared/services/presence.service";

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
	meetupId;
	meetupSubscriptionSnapshot: any;
	meetupRole: string;
	meetings: any;
	meetupList: any;
	loggedInUserFromAuthServiceSubscription: Subscription;
	selectedMeetupDocData: any;
	loggedInUserDocData: any;
	hasSelectedMeetupDocumentLoaded: Promise<boolean>;
	private meetupInContextServiceSubscription: Subscription;

	constructor(
		public authService: AuthService,
		public router: Router,
		private route: ActivatedRoute,
		private auth: AngularFireAuth,
		public afs: AngularFirestore,
		private userService: UserService,
		private data: DataService,
		public meetupInContextService: MeetupInContextService,
		public presenceService: PresenceService
	) {
		this.route.paramMap.subscribe((params) => {
			this.meetupId = params.get('id');
		});
	}

	ngOnInit(): void {

		if (this.meetupInContextService.meetupInContext) {
			this.selectedMeetupDocData = this.meetupInContextService.meetupInContext;
			this.hasSelectedMeetupDocumentLoaded = Promise.resolve(true);
		}

		this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(firebaseUser => {
			this.loggedInUserDocData = firebaseUser;
			if (firebaseUser &&
				firebaseUser.meetupSubscriptionSnapshots &&
				firebaseUser.meetupSubscriptionSnapshots.length > 0) {
				this.meetupList = firebaseUser.meetupSubscriptionSnapshots;

				this.meetupInContextServiceSubscription = this.meetupInContextService.meetupInContextSubject.subscribe(meetupInContext => {
					if (meetupInContext) {
						this.selectedMeetupDocData = meetupInContext;
						this.hasSelectedMeetupDocumentLoaded = Promise.resolve(true);
						this.meetupId = this.selectedMeetupDocData.id;
						this.meetupSubscriptionSnapshot = this.loggedInUserDocData?.meetupSubscriptionSnapshots.find((m) => m.meetupId === this.meetupId);//TODO -- add id in om collection docs in onCreateMeetup and change the field name here
						if (this.meetupSubscriptionSnapshot && this.meetupSubscriptionSnapshot.role && this.meetupSubscriptionSnapshot.role.length > 0) {
							this.meetupRole = this.meetupSubscriptionSnapshot.role[0];
						}
					}
				});
			}
		});



	}

	/**
	 * If the current user is a guest and not joined any meetups
	 * and the current url is at meetup, then redirect to meeting page
	 */
	private handleGuestRedirect() {
		if (this.userCollection && this.userCollection.isAnonymous &&
			(!this.userCollection.meetupSubscriptionSnapshots ||
				this.userCollection.meetupSubscriptionSnapshots.length < 0) &&
			!this.router.url.includes('/dashboard/meetup/')
		) {
			this.router.navigate(['/dashboard/meetings']);
		}
	}

	/*setMeetupData() {
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
		this.meetupInContextService.meetupInContextSubject.next(this.currentMeetup);
		// this.data.UpdateMeetup(m.meetupId);
	}*/

	ShowSecureYourAccountPopup(e) {
		e.preventDefault();
		this.showSecureAccountPopup = true;
	}

	ClosePopup() {
		this.showSecureAccountPopup = false;
	}

	async changeMeetup(m) {
		if (m.meetupId !== this.meetupId) {
			this.meetupId = m.meetupId;
			let meetupDocumentSnapshot = this.afs.collection('OnlineMeetups').doc(this.meetupId);
			meetupDocumentSnapshot.snapshotChanges().subscribe((snapshot) => {
				this.selectedMeetupDocData = snapshot.payload.data();
				this.hasSelectedMeetupDocumentLoaded = Promise.resolve(true);
				this.meetupInContextService.meetupInContextSubject.next(this.selectedMeetupDocData);
			});
			this.afs.collection('Users').doc(this.loggedInUserDocData.uid).update({
				lastMeetupInContextId : this.meetupId
			}).then(function(){
				console.log('meetup in context updated in user doc');
			});
			if (this.loggedInUserDocData &&
				this.loggedInUserDocData.meetupSubscriptionSnapshots &&
				this.loggedInUserDocData.meetupSubscriptionSnapshots.length > 0) {
				this.meetupList = this.loggedInUserDocData.meetupSubscriptionSnapshots;
				this.meetupSubscriptionSnapshot = this.loggedInUserDocData.meetupSubscriptionSnapshots.find((m) => m.meetupId === this.meetupId);
				if (this.meetupSubscriptionSnapshot && this.meetupSubscriptionSnapshot.role && this.meetupSubscriptionSnapshot.role.length > 0) {
					this.meetupRole = this.meetupSubscriptionSnapshot.role[0];
				}
			}
			this.router.navigateByUrl(`/dashboard/meetup/${m.meetupId}`);
		}
	}

	ngOnDestroy(): void {
		this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
		this.meetupInContextServiceSubscription?.unsubscribe();
	}


}
