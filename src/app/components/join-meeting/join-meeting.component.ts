import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AngularFireAuth} from '@angular/fire/auth';
import {HttpClient} from '@angular/common/http';
import {AngularFirestore} from '@angular/fire/firestore';
import {first} from "rxjs/operators";
import {AngularFireFunctions} from "@angular/fire/functions";
import {AuthService} from "../../shared/services/auth.service";
import {Subscription} from "rxjs";
import {firestore} from "firebase";

@Component({
	selector: 'app-join-meeting',
	templateUrl: './join-meeting.component.html',
	styleUrls: ['./join-meeting.component.scss']
})
export class JoinMeetingComponent implements OnInit {
	meetingUuidFromURL: string;
	hasLoginSession: boolean;
	private loggedInUserFromAuthServiceSubscription: Subscription;
	private loggedInUserDocDataFromAuthService: any;
	private meetingDataFromGetMeetingByUuidApi: any;
	private authTokenSubscription: Subscription;

	constructor(
		private route: ActivatedRoute,
		private auth: AngularFireAuth,
		private http: HttpClient,
		private router: Router,
		private afs: AngularFirestore,
		private fns: AngularFireFunctions,
		private authService: AuthService
	) {
		this.route.paramMap.subscribe(params => {
			this.meetingUuidFromURL = params.get('id');
		});
		this.hasLoginSession = true;
		auth.idToken.subscribe(token => {
			if (!token) {
				this.hasLoginSession = false;
			}
		});

		this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(firebaseUser => {
			this.loggedInUserDocDataFromAuthService = firebaseUser;
		});

		/*const getMeetingByUuidApiUrl = `https://us-central1-online-meetups-e955d.cloudfunctions.net/api/meetinguuids/${this.meetingUuidFromURL}`;
		this.http.get<any>(getMeetingByUuidApiUrl).subscribe(getMeetingByUuidApiResponse => {
			this.meetingDataFromGetMeetingByUuidApi = getMeetingByUuidApiResponse
		});*/

	}

	ngOnInit(): void {
		this.fetchMeeting();
	}

	async fetchMeeting() {
		console.log('join meeting component');
		const apiUri = `https://us-central1-online-meetups-e955d.cloudfunctions.net/api/meetinguuids/${this.meetingUuidFromURL}`;
		this.authTokenSubscription = this.auth.idToken.subscribe(token => {
			if (token) {
				this.hasLoginSession = true;
				const headers = {
					'Content-Type': 'application/json',
					Authorization: 'Bearer ' + token
				};
				this.http.get<any>(apiUri, {headers}).subscribe(getMeetingbyUuidResponseData => {
					if (getMeetingbyUuidResponseData) {
						this.auth.authState.subscribe(async firebaseUserObject => {
							if (firebaseUserObject) {
								if (!firebaseUserObject.isAnonymous) {
									const callable = this.fns.httpsCallable(`addSelfToMeetingAsParticipant`);
									try {
										let apiResponse = callable({
											meetingId: getMeetingbyUuidResponseData.id,
											uid: firebaseUserObject.uid
										})
											.pipe(first())
											.subscribe(resp => {
												console.log('addSelfToMeetingAsParticipantResponse:' + JSON.stringify(resp));
											}, err => {
												console.log('Error in calling addSelfToMeetingAsParticipant CF:' + err.message);
												//TODO -- add error display in case of failure/error and success message on meetings page if it succeeds
											});
										//console.log('apiResponse:' + apiResponse);
										setTimeout(() => {
											this.router.navigate([`/dashboard/meetings`]);
										}, 100);
									} catch (error) {
										//TODO(copy) -- add error display in case of failure/error and success message on meetings page if it succeeds
										console.log('Error in calling addSelfToMeetingAsParticipant CF:' + error.message);
									}

								} else {
									let userDocSnapshot = await firestore().collection('Users').doc(firebaseUserObject.uid).get();
									if (!userDocSnapshot.exists && this.meetingUuidFromURL) {
										this.router.navigate([`/guest/${this.meetingUuidFromURL}/form`]);
									} else {
										const callable = this.fns.httpsCallable(`addSelfToMeetingAsParticipant`);
										try {
											let apiResponse = callable({
												meetingId: getMeetingbyUuidResponseData.id,
												uid: firebaseUserObject.uid
											})
												.pipe(first())
												.subscribe(resp => {
													console.log('addSelfToMeetingAsParticipantResponse:' + JSON.stringify(resp));
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
											this.router.navigate([`/dashboard/meetings`]);
										}, 100);
									}
								}
							}
						});
					}
				});


			} else {
				setTimeout(() => {
					this.router.navigate([`/sign-in`, {id: this.meetingUuidFromURL}]);
				}, 100);
			}


		});
	}

	ngOnDestroy(): void {
		this.loggedInUserFromAuthServiceSubscription.unsubscribe();
		if (this.authTokenSubscription) {
			this.authTokenSubscription.unsubscribe();
		}
	}

	/*ngOnInit(): void {
		console.log('In ngOnInit in Join Meeting Component');
		if (this.loggedInUserDocDataFromAuthService) {
			//User is logged-in by anonymous or non-anonymous login

			if (this.meetingDataFromGetMeetingByUuidApi) {
				//Add self as participant to meeting

			}
		} else {
			//User is not logged-in. Need to log him in in Guest Form Component after capturing his name
		}
		this.auth.idToken.subscribe(token => {
			if (token) {
				this.hasLoginSession = true;
				const headers = {
					'Content-Type': 'application/json',
					Authorization: 'Bearer ' + token
				};
				this.auth.authState.subscribe(firebaseUserRecord => {
					if (firebaseUserRecord) {
						if (!firebaseUserRecord.isAnonymous) {

						} else {
							const loggedInUserDocRef = this.afs.collection('Users').doc(firebaseUserRecord.uid);
							loggedInUserDocRef.snapshotChanges().subscribe((loggedInUserDocSnapshot) => {
								const loggedInUserDocData = loggedInUserDocSnapshot.payload.data();

								if (typeof loggedInUserDocData === 'undefined' && this.meetingUuidFromURL) {
									//User doesn't have a user doc created => POST Anonymous User API needs to be called in guest form component
									//After user doc has been created in Guest Form Component then that user will be added as a registrant to the meeting
									this.router.navigate([`/guest/${this.meetingUuidFromURL}/form`]);
								} else {
									//Add self as participant to meeting
									const callable = this.fns.httpsCallable(`addSelfToMeetingAsParticipant`);
									try {
										let apiResponse = callable({
											meetingId: ''
										})
											.pipe(first())
											.subscribe(resp => {
												console.log({resp});
												setTimeout(() => {
													this.router.navigate([`/dashboard/meetings`]);
												}, 100);
											}, err => {
												console.log('Error in calling addSelfToMeetingAsParticipant CF:' + err.message);
												//TODO -- add error display in case of failure/error and success message on meetings page if it succeeds
											});
										//console.log('apiResponse:' + apiResponse);
									} catch (error) {
										//TODO(copy) -- add error display in case of failure/error and success message on meetings page if it succeeds
										console.log('Error in calling addSelfToMeetingAsParticipant CF:' + error.message);
									}


								}
							});
						}
					}
				});
			} else {
				setTimeout(() => {
					this.router.navigate([`/sign-in`, {id: this.meetingUuidFromURL}]);
				}, 100);
			}
		});
	}*/
}
