import {Component, NgZone, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AuthService} from '../../shared/services/auth.service';
import {AngularFireFunctions} from '@angular/fire/functions';
import {AngularFireAuth} from '@angular/fire/auth';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute, Router} from '@angular/router';
import * as moment from "moment";
import {Subscription} from "rxjs";
import {first} from "rxjs/operators";

@Component({
	selector: 'app-guest-form',
	templateUrl: './guest-form.component.html',
	styleUrls: ['./guest-form.component.scss']
})
export class GuestFormComponent implements OnInit {
	joinForm: FormGroup;
	meetingUuid: string;
	meetingDocData: any;
	private loggedInUserFromAuthServiceSubscription: Subscription;
	private loggedInUserDocData: any;
	frompm: string;
	returnUrl: string;
	forJoiningMeeting: boolean;
	forJoiningMeetup: boolean;
	meetupToJoinId: string;
	publicMeetupDocData: any;

	constructor(
		public authService: AuthService,
		private fns: AngularFireFunctions,
		private auth: AngularFireAuth,
		public http: HttpClient,
		public ngZone: NgZone,
		public router: Router,
		private route: ActivatedRoute
	) {
		if (this.route.snapshot.queryParams['frompm']) {
			this.frompm = this.route.snapshot.queryParams['frompm'];
			this.returnUrl = this.route.snapshot.queryParams['returnUrl'];
			this.meetupToJoinId = this.route.snapshot.queryParams['mid'];
			this.forJoiningMeetup = true
		} else {
			// get the meeting id from the url parameter
			route.params.subscribe(params => {
				if (params.id) {
					this.meetingUuid = params.id;
					// get the meeting
					this.getMeeting();
					this.forJoiningMeeting = true;
				}
			});
		}

		this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(firebaseUser => {
			this.loggedInUserDocData = firebaseUser;
		});
	}

	ngOnInit(): void {
		// generate form
		this.joinForm = new FormGroup({
			displayName: new FormControl('', Validators.required),
			email: new FormControl('', Validators.email)
		});
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

	get meetingDate(): Date {
		if (this.meetingDocData && this.meetingDocData.startsAt) {
			return moment.unix(this.meetingDocData.startsAt._seconds).toDate();
		}
		return null;
	}

	/**
	 * On submit form
	 * If the form is valid, then create firebase user and then user collection with form data
	 * Redirect after user collection creation
	 */
	async submitForm() {
		if (this.joinForm.invalid) {
			return;
		}

		if (this.forJoiningMeeting) {
			const data = {...this.joinForm.value, securityQnA: {}};
			if (!this.loggedInUserDocData || (this.loggedInUserDocData && this.loggedInUserDocData.createdAt)) {
				// user collection create api
				const apiUri = 'https://us-central1-online-meetups-e955d.cloudfunctions.net/api/anonymoususers';
				// create firebase user
				const user = await this.createFirebaseUser();
				// check if authenticated
				this.auth.idToken.subscribe(token => {
					if (token) {
						const headers = {
							'Content-Type': 'application/json',
							Authorization: 'Bearer ' + token,
							responseType: 'text'
						};
						// create user collection using the auth token
						this.http.post<any>(apiUri, data, {
							headers,
							responseType: 'text' as 'json'
						}).subscribe(response => {
							// redirect
							this.redirectAfterJoiningMeeting(user);
						}, error => {
							console.error(error);
						});
					}
				});
			}
		} else if (this.forJoiningMeetup) {
			const data = {...this.joinForm.value, securityQnA: {}};
			if (!this.loggedInUserDocData || (this.loggedInUserDocData && this.loggedInUserDocData.createdAt)) {
				// user collection create api
				const apiUri = 'https://us-central1-online-meetups-e955d.cloudfunctions.net/api/anonymoususers';
				// create firebase user
				const user = await this.createFirebaseUser();
				// check if authenticated
				this.auth.idToken.subscribe(token => {
					if (token) {
						const headers = {
							'Content-Type': 'application/json',
							Authorization: 'Bearer ' + token,
							responseType: 'text'
						};
						// create user collection using the auth token
						this.http.post<any>(apiUri, data, {
							headers,
							responseType: 'text' as 'json'
						}).subscribe(response => {
							// redirect
							this.redirectToJoinMeetup(user);
						}, error => {
							console.error(error);
						});
					}
				});
			}
		}
	}

	/**
	 * Use firebase anonymous user creation to create user
	 */
	async createFirebaseUser() {
		const response = await this.auth.signInAnonymously();
		if (response.user) {
			return response.user;
		}
		return false;
	}

	/**
	 * Set the auth details in local storage
	 * Add self as a participant to meeting
	 * Redirect to the meeting page
	 */
	redirectAfterJoiningMeeting(user) {
		localStorage.setItem('user', JSON.stringify(user));
		localStorage.setItem('isAuth', 'true');
		localStorage.setItem('closed', 'false');
		//TODO -- check the below logic further
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
						uid: user.uid

					})
						.pipe(first())
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

	redirectToJoinMeetup(user) {
		setTimeout(() => {
			this.router.navigate(['/dashboard/meetups', this.meetupToJoinId, 'join']);
		}, 100);
	}

	/**
	 * Redirect to sign in page
	 */
	async RedirectToSignIn(e) {
		e.preventDefault();
		await this.router.navigate([`/sign-in`, {id: this.meetingUuid}]);
	}
}
