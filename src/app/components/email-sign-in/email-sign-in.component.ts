import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../shared/services/auth.service';
import {ToastrService} from 'ngx-toastr';
import {ActivatedRoute} from "@angular/router";

@Component({
	selector: 'app-email-sign-in',
	templateUrl: './email-sign-in.component.html',
	styleUrls: ['./email-sign-in.component.scss']
})
export class EmailSignInComponent implements OnInit {

	public disabledButton = false;
	public emptyOrInvalidInput = false;
	private emailPattern: RegExp = new RegExp(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
	frompm: string;
	returnUrl: string;
	meetupId: string;
	meetingUuid: string;
	forJoiningMeeting: boolean;
	forJoiningMeetup: boolean;

	constructor(
		public authService: AuthService,
		private toastrService: ToastrService,
		private route: ActivatedRoute
	) {
		if (this.route.snapshot.queryParams['frompm']) {
			this.frompm = this.route.snapshot.queryParams['frompm'];
			this.returnUrl = this.route.snapshot.queryParams['returnUrl'];
			this.meetupId = this.route.snapshot.queryParams['mid'];
			this.forJoiningMeetup = true;
		} else if (this.route.snapshot.queryParams['meetingUuid']) {
			// get the meeting id from the url parameter
			this.meetingUuid = this.route.snapshot.queryParams['meetingUuid'];
			this.returnUrl = this.route.snapshot.queryParams['returnUrl'];
			this.forJoiningMeeting = true;
		}
	}

	ngOnInit(): void {
	}

	async passwordlesSignin(email) {
		if (!email || !email.trim()) {
			this.emptyOrInvalidInput = true;
		} else {
			console.log('this.emailPattern.test(email):' + this.emailPattern.test(email))
			if (!this.emailPattern.test(email)) {
				this.emptyOrInvalidInput = true;
			} else {
				this.emptyOrInvalidInput = false;
				this.disabledButton = true;
				try {
					if (this.forJoiningMeeting) {
						await this.authService.passwordlesSignin(email, `?` + `${this.returnUrl ? 'returnUrl=' + this.returnUrl + '&' : ''}meetingUuid=${this.meetingUuid}`);
					} else if (this.forJoiningMeetup) {
						await this.authService.passwordlesSignin(email, `?mid=${this.meetupId}&frompm=${this.frompm}`);//returnUrl will have the meetupname
					} else {
						await this.authService.passwordlesSignin(email, null);
					}
					this.toastrService.success('Login email sent, please check your inbox.', null, {closeButton: true});
				} catch (error) {
					console.error('error in sending email sign-in:', error)
					this.disabledButton = false;
					this.emptyOrInvalidInput = true;
				}
			}
		}

	}

}
