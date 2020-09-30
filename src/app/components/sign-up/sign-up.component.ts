import {Component, NgZone, OnInit} from '@angular/core';

import {AuthService} from '../../shared/services/auth.service';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {Subscription} from "rxjs";
import {HttpClient} from "@angular/common/http";
import * as moment from "moment";
import {first} from "rxjs/operators";
import {AngularFireFunctions} from "@angular/fire/functions";

@Component({
	selector: 'app-sign-up',
	templateUrl: './sign-up.component.html',
	styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnInit {

	signUpForm: FormGroup;
	tempUser: any;
	public loggedInUserFromAuthServiceSubscription: Subscription;
	public loggedInUserDocData: any;
	frompm: string;
	returnUrl: string;
	forJoiningMeeting: boolean;
	forJoiningMeetup: boolean;
	meetupToJoinId: string;
	meetingUuid: string;
	meetingDocData: any;

	constructor(
		public authService: AuthService,
		private fns: AngularFireFunctions,
		public auth: AngularFireAuth, // Inject Firebase auth service,
		public afs: AngularFirestore,   // Inject Firestore service,
		public ngZone: NgZone, // NgZone service to remove outside scope warning
		private router: Router,
		private route: ActivatedRoute,
		public http: HttpClient
	) {
		if (this.route.snapshot.queryParams['frompm']) {
			this.frompm = this.route.snapshot.queryParams['frompm'];
			this.returnUrl = this.route.snapshot.queryParams['returnUrl'];
			this.meetupToJoinId = this.route.snapshot.queryParams['mid'];
			this.forJoiningMeetup = true
		} else if (this.route.snapshot.queryParams['meetingUuid']) {
			// get the meeting id from the url parameter
			this.meetingUuid = this.route.snapshot.queryParams['meetingUuid'];
			this.returnUrl = this.route.snapshot.queryParams['returnUrl'];
			this.forJoiningMeeting = true;
		}
		//JSON.parse(localStorage.getItem('temp-user'));
		console.log('Before subscribing to loggedInUserFromAuthService subscription in sign-up component');
		this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(firebaseUser => {
			this.loggedInUserDocData = firebaseUser;
			if (!this.signUpForm && this.loggedInUserDocData && (!this.loggedInUserDocData.hasCompletedSignUp)) {
				console.log('setting sign-up form with values');
				if (this.forJoiningMeeting) {
					this.getMeeting();
				}
				this.signUpForm = new FormGroup({
					name: new FormControl(this.loggedInUserDocData.displayName, Validators.required),
					email: new FormControl(this.loggedInUserDocData.email, Validators.required),
					contact: new FormControl('')
				});

			} else if (this.loggedInUserDocData && this.loggedInUserDocData.hasCompletedSignUp) {
				if (this.forJoiningMeetup) {
					this.router.navigate(['/dashboard/meetups', this.meetupToJoinId, 'join']);
				} else if (this.forJoiningMeeting) {
					if (!this.meetingDocData) {
						const apiUri = `https://us-central1-online-meetups-e955d.cloudfunctions.net/api/meetinguuids/${this.meetingUuid}`;
						const headers = {
							'Content-Type': 'application/json'
						};
						this.http.get<any>(apiUri, {headers}).subscribe(data => {
							if (data && data.uuid) {
								this.meetingDocData = data;
								this.addToMeetingNSendToMeetingsPage();
							}
						});
					}
				} else {
					this.router.navigate(['dashboard/meetups']);
				}
			}
		});
	}

	ngOnInit(): void {

	}

	//Get the meeting from collection. This call does not require authentication
	getMeeting() {
		if (this.meetingUuid) {
			const apiUri = `https://us-central1-online-meetups-e955d.cloudfunctions.net/api/meetinguuids/${this.meetingUuid}`;
			const headers = {
				'Content-Type': 'application/json'
			};
			this.http.get<any>(apiUri, {headers}).subscribe(data => {
				if (data && data.uuid) {
					this.meetingDocData = data;
				}
			});
		}
	}

	async submitSignUpForm(e) {
		e.preventDefault();
		if (this.signUpForm.invalid) {
			return false;
		}

		/*	this.tempUser.email = formData.email;
			this.tempUser.contact = formData.contact;
			this.tempUser.displayName = formData.name;
			this.tempUser.isSignedUp = true;
			localStorage.setItem('displayName', formData.name);
		*/
		await this.SaveSignedUpUser();
	}

	/**
	 * Handle user data once the sign up form filled and submitted
	 * The user data includes the form data entered
	 */
	async SaveSignedUpUser() {
		console.log('reached save signed up user');
		localStorage.setItem('isAuth', 'true');
		const formData = this.signUpForm.value;
		const userDocReference = this.afs.collection<any>('Users').doc(this.loggedInUserDocData.uid);
		await userDocReference.update({
			email: this.loggedInUserDocData.email,
			phoneNumber: formData.contact,
			displayName: formData.name,
			hasCompletedSignUp: true
		});

		if (this.forJoiningMeetup) {
			await this.router.navigate(['/dashboard/meetups', this.meetupToJoinId, 'join']);
		} else if (this.forJoiningMeeting) {
			await this.addToMeetingNSendToMeetingsPage();
		}
	}

	async addToMeetingNSendToMeetingsPage() {
		if (this.meetingDocData && this.meetingDocData.endsAt && moment.unix(this.meetingDocData.endsAt.seconds).isBefore(moment())) {
			setTimeout(() => {
				this.router.navigate([`dashboard/meetings`, JSON.stringify({showFailureMesssage: 'Could not add you to the meeting as it has ended! You have been added to the meetup as a GUEST'})]);
			}, 100);
		} else {
			this.ngZone.run(() => {
				const callable = this.fns.httpsCallable(`addSelfToMeetingAsParticipant`);
				try {
					let apiResponse = callable({
						meetingId: this.meetingDocData.id,
						uid: this.loggedInUserDocData.uid

					}).pipe(first())
						.subscribe(resp => {
							console.log({resp});
						}, err => {
							console.log('Error in calling addSelfToMeetingAsParticipant CF:' + err.message);
							//TODO -- add error display in case of failure/error and success message on meetings page if it succeeds
						});
					//console.log('apiResponse:' + apiResponse);
				} catch (error) {
					//TODO(copy) -- add error display in case of failure/error and success message on meetings page if it succeeds
					console.log('Error in calling addSelfToMeetingAsParticipant CF:' + error.message);
				}

				setTimeout(() => {
					this.router.navigate([`dashboard/meetings`]);
				}, 100);

			});
		}

	}

	get meetingDate(): Date {
		if (this.meetingDocData && this.meetingDocData.startsAt) {
			return moment.unix(this.meetingDocData.startsAt._seconds).toDate();
		}
		return null;
	}

	/**
	 * Redirect back to sign in page
	 * Clear the temp user
	 */
	RedirectToSignIn(e) {
		e.preventDefault();
		localStorage.setItem('temp-user', null);
		this.authService.signOut();
	}

	ngOnDestroy(): void {
		this.loggedInUserFromAuthServiceSubscription.unsubscribe();
	}
}
