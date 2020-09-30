import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subscription} from "rxjs";
import {AuthService} from "../../../../shared/services/auth.service";
import {Location} from '@angular/common';
import {AngularFireFunctions} from '@angular/fire/functions';
import {first} from "rxjs/operators";

@Component({
	selector: 'app-join-public-meetups',
	templateUrl: './join-public-meetups.component.html',
	styleUrls: ['./join-public-meetups.component.scss']
})
export class JoinPublicMeetupsComponent implements OnInit {

	meetupIdToJoin: string;
	loggedInUserFromAuthServiceSubscription: Subscription;
	firebaseUserDocument: any;
	meetupDocument: any;
	showJoiningPopup: boolean;
	questionForm: FormGroup;
	angularFireFunctions: AngularFireFunctions;

	constructor(
		private route: ActivatedRoute,
		private auth: AngularFireAuth,
		private afs: AngularFirestore,
		public authService: AuthService,
		public router: Router,
		private location: Location,
		private fns: AngularFireFunctions
	) {
		this.angularFireFunctions = fns;
		//this.meetupIdToJoin = 'ckgpTxX0AQ4xx7xZRXJV';
		route.params.subscribe(params => {
			if (params.id) {
				this.meetupIdToJoin = params.id;
			}
		});
		this.FetchMeetup();
	}

	ngOnInit(): void {
		this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(firebaseUser => {
			if (firebaseUser) {
				console.log('Firebase User found in ngOnInit...');
				console.log(firebaseUser);
				this.firebaseUserDocument = firebaseUser;
				if (this.isMember) {
					console.log('Already a member. Forwarding to meetup dashboard with the meetup with id = meetupId in url');
					this.router.navigateByUrl(`/dashboard/meetup/${this.meetupIdToJoin}`);
				} else {
					//TODO -- fix the extra redirection below that is a temp fix for first time user with no subscriptions not reaching meetup join page
					this.router.navigate([`/dashboard/meetups/${this.meetupIdToJoin}/join`], {queryParams: {returnUrl: `/dashboard/meetups/${this.meetupIdToJoin}/join`}});
				}
			}
		});

	}

	FetchMeetup() {
		this.auth.idToken.subscribe((data) => {
			const meetupDocumentSnapshot = this.afs.collection('OnlineMeetups').doc(this.meetupIdToJoin);
			meetupDocumentSnapshot.snapshotChanges().subscribe((snapshot) => {
				this.meetupDocument = snapshot.payload.data();
				console.log('meetup collection', this.meetupDocument);
				if(!this.meetupDocument.hasJoiningQuestions){
					const callable = this.angularFireFunctions.httpsCallable(`addAsMemberNonTrustedWithJoiningQnA`);
					try {
						let apiResponse = callable({
							meetupId: this.meetupIdToJoin,
							joiningQnA: []
						})
							.pipe(first())
							.subscribe(resp => {
								console.log({resp});
								this.showJoiningPopup = false;
							}, err => {
								console.log('Error in calling addAsMemberNonTrustedWithJoiningQnA CF:' + err.message);
							});
						//console.log('apiResponse:' + apiResponse);
					} catch (error) {
						console.log('Error in calling addAsMemberNonTrustedWithJoiningQnA CF:' + error.message);
					}
				} else {
					this.showJoiningPopup = true;
					this.handleMeetupQuestions();
				}
			});
		});
	}

	handleMeetupQuestions() {
		if (!this.isMember) {
			const group = {};
			if (this.joiningQuestions && this.joiningQuestions.length > 0) {
				this.joiningQuestions.forEach((question, key) => {
					group[`question-${key}`] = new FormControl('', Validators.required);
				});
				this.questionForm = new FormGroup(group);
				this.showJoiningPopup = true;
			}
		}
	}

	get joiningQuestions(): any {
		return this.meetupDocument.joiningQuestions || [];
	}

	/**
	 * Check if the user is already a member of the meetup
	 */
	get isMember(): boolean {
		//console.log(this.firebaseUserDocument.meetupSubscriptionSnapshots.find(meetup => meetup.meetupId === this.meetupIdToJoin));
		return this.firebaseUserDocument &&
			this.firebaseUserDocument.meetupSubscriptionSnapshots &&
			this.firebaseUserDocument.meetupSubscriptionSnapshots.length > 0 &&
			this.firebaseUserDocument.meetupSubscriptionSnapshots.find(meetup => meetup.meetupId === this.meetupIdToJoin);
	}

	submitQuestionForm() {
		if (this.questionForm.invalid) {
			return false;
		}
		const formData = [];
		const formValues = this.questionForm.value;
		this.joiningQuestions.forEach((question, key) => {
			formData.push({...question, ...{answer: formValues[`question-${key}`]}});
		});
		console.log(formData);
		const callable = this.angularFireFunctions.httpsCallable(`addAsMemberNonTrustedWithJoiningQnA`);
		try {
			let apiResponse = callable({
				meetupId: this.meetupIdToJoin,
				joiningQnA: formData
			})
				.pipe(first())
				.subscribe(resp => {
					console.log({resp});
					this.showJoiningPopup = false;
				}, err => {
					console.log('Error in calling addAsMemberNonTrustedWithJoiningQnA CF:' + err.message);
				});
			//console.log('apiResponse:' + apiResponse);
		} catch (error) {
			console.log('Error in calling addAsMemberNonTrustedWithJoiningQnA CF:' + error.message);
		}

	}

	cancelClicked() {
		this.showJoiningPopup = false;
		this.router.navigate(['/dashboard/meetups']);
	}

	ngOnDestroy(): void {
		this.loggedInUserFromAuthServiceSubscription.unsubscribe();
	}
}
