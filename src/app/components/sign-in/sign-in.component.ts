import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../shared/services/auth.service';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import * as moment from 'moment';

@Component({
	selector: 'app-sign-in',
	templateUrl: './sign-in.component.html',
	styleUrls: ['./sign-in.component.scss'],
})
export class SignInComponent implements OnInit {
	meetingUuid: string;
	meetingDocData: any;
	frompm: string;
	returnUrl: string;
	meetupId: string;

	constructor(
		public authService: AuthService,
		private route: ActivatedRoute,
		private router: Router,
		private http: HttpClient,
	) {
		if (this.route.snapshot.queryParams['frompm']) {
			this.frompm = this.route.snapshot.queryParams['frompm'];
			this.returnUrl = this.route.snapshot.queryParams['returnUrl'];
			this.meetupId = this.route.snapshot.queryParams['mid'];
		}
		// get the params if any
		route.params.subscribe(params => {
			if (params.id) {
				this.meetingUuid = params.id;
				//localStorage.setItem('meetingUuid', params.id); --delete in Oct if no side effect of this commenting is visible
				// if meeting id is present, then fetch the meeting collection
				this.fetchMeeting();
			}
		});
	}

	ngOnInit(): void {

	}

	fetchMeeting() {
		const apiUri = `https://us-central1-online-meetups-e955d.cloudfunctions.net/api/meetinguuids/${this.meetingUuid}`;
		const headers = {
			'Content-Type': 'application/json',
		};
		this.http.get<any>(apiUri, {headers}).subscribe(data => {
			if (data && data.uuid) {
				this.meetingDocData = data;
			}
		});
	}

	navigateToGuestLogin() {
		if (this.meetingUuid) {
			this.router.navigate([`/guest/${this.meetingUuid}/form`], {
				queryParams: {
					returnUrl: this.returnUrl
				}
			});
		} else if (this.frompm) {
			this.router.navigate([`/guest/${this.meetingUuid}/form`], {
				queryParams: {
					frompm: this.frompm,
					mid: this.meetupId
				}
			});//returnUrl will have the meetupname
		}
	}

	async appleSignIn() {
		if (this.meetingUuid) {
			await this.authService.appleSignin({returnUrl: this.returnUrl, meetingUuid: this.meetingUuid});
		} else if (this.frompm) {
			await this.authService.appleSignin({frompm: this.frompm, mid: this.meetupId});
		} else {
			await this.authService.appleSignin({});
		}
	}

	async googleSignIn() {
		if (this.meetingUuid) {
			await this.authService.googleSignin({returnUrl: this.returnUrl, meetingUuid: this.meetingUuid});
		} else if (this.frompm) {
			await this.authService.googleSignin({frompm: this.frompm, mid: this.meetupId});
		} else {
			await this.authService.googleSignin({});
		}
	}

	async facebookSignIn() {
		if (this.meetingUuid) {
			await this.authService.facebookSignin({returnUrl: this.returnUrl, meetingUuid: this.meetingUuid});
		} else if (this.frompm) {
			await this.authService.facebookSignin({frompm: this.frompm, mid: this.meetupId});
		} else {
			await this.authService.facebookSignin({});
		}
	}

	async emailLinkSignIn() {
		if (this.meetingUuid) {
			await this.router.navigate(['email-sign-in'], {queryParams: {returnUrl: this.returnUrl, meetingUuid: this.meetingUuid}});
		} else if (this.frompm) {
			await this.router.navigate(['email-sign-in'], {queryParams: {frompm: this.frompm, mid: this.meetupId}});
		} else {
			await this.router.navigate(['email-sign-in']);
		}
	}


	/**
	 * If the guest login option needs to show or not
	 * Check if meeting id is present, then show
	 */
	get isGuestLoginVisible(): boolean {
		return !!this.meetingUuid || !!this.frompm;
	}

	get meetingDate(): Date {
		if (this.meetingDocData && this.meetingDocData.startsAt) {
			return moment.unix(this.meetingDocData.startsAt._seconds).toDate();
		}
		return null;
	}
}
