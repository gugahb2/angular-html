import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../../shared/services/auth.service';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
import {Subscription} from "rxjs";
import {MeetupInContextService} from "../../../shared/services/meetup-in-context.service";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
	selector: 'app-navigation',
	templateUrl: './navigation.component.html',
	styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {
	user: any;
	userCollection: any;
	private meetupInContextServiceSubscription: Subscription;
	public selectedMeetupDocData: any;
	hasSelectedMeetupDocumentLoaded: Promise<boolean>;
	private loggedInUserFromAuthServiceSubscription: Subscription;
	private loggedInUserDocData: any;
	private meetupList: any;
	meetupSubscriptionSnapshot: any;
	meetupRole: any;
	private meetupId: string;
	isNavigationDisabled : boolean = true;

	constructor(
		public authService: AuthService,
		private auth: AngularFireAuth,
		public afs: AngularFirestore,
		private meetupInContextService: MeetupInContextService,
		public router: Router,
		public route: ActivatedRoute
	) {

		this.route.paramMap.subscribe((params) => {
			this.meetupId = params.get('id');
		});

		this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(firebaseUser => {
			this.loggedInUserDocData = firebaseUser;
			this.meetupInContextServiceSubscription = this.meetupInContextService.meetupInContextSubject.subscribe(meetupInContext => {
				if (meetupInContext) {
					this.selectedMeetupDocData = meetupInContext;
					this.isNavigationDisabled = false;

					if (firebaseUser &&
						firebaseUser.meetupSubscriptionSnapshots &&
						firebaseUser.meetupSubscriptionSnapshots.length > 0) {
						this.meetupList = firebaseUser.meetupSubscriptionSnapshots;
						this.meetupSubscriptionSnapshot = firebaseUser.meetupSubscriptionSnapshots.find((m) => m.meetupId === this.selectedMeetupDocData.id);
						if (this.meetupSubscriptionSnapshot && this.meetupSubscriptionSnapshot.role && this.meetupSubscriptionSnapshot.role.length > 0) {
							this.meetupRole = this.meetupSubscriptionSnapshot.role[0];
						}
					}
					this.hasSelectedMeetupDocumentLoaded = Promise.resolve(true);
				}
			});

		});


	}

	ngOnInit(): void {
	}

	GetUserCollection() {
		this.auth.idToken.subscribe(data => {
			const user = this.afs.collection('Users').doc(this.user.uid);
			user.snapshotChanges().subscribe((snapshot) => {
				this.userCollection = snapshot.payload.data();
			});
		});
	}

	async homeLinkClicked() {
		console.log('Link clicked');
		if(this.selectedMeetupDocData) {
			await this.router.navigate([`dashboard/meetup/${this.selectedMeetupDocData.id}`]);
		} else {
			await this.router.navigate([`dashboard/meetups`]);
		}
	}

	ngOnDestroy(): void {
		this.loggedInUserFromAuthServiceSubscription.unsubscribe();
		this.meetupInContextServiceSubscription.unsubscribe();
	}
}
