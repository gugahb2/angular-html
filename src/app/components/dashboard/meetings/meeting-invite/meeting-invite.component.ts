import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../../../shared/services/auth.service';
import {ApiService} from '../../../../shared/services/api.service';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
import {ActivatedRoute, Router} from '@angular/router';
import * as moment from 'moment';
import {ToastrService} from 'ngx-toastr';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {UserService} from "../../../../shared/services/user.service";
import {MeetupInContextService} from "../../../../shared/services/meetup-in-context.service";
import {Subscription} from "rxjs";

@Component({
	selector: 'app-meeting-invite',
	templateUrl: './meeting-invite.component.html',
	styleUrls: ['./meeting-invite.component.scss']
})
export class MeetingInviteComponent implements OnInit {
	meetingId: string;
	meetingDocData: any;
	peopleForm: FormGroup;
	private loggedInUserFromAuthServiceSubscription: Subscription;
	private loggedInUserDocData: any;
	private meetupList: any;
	private meetupId: any;
	private meetupSubscriptionSnapshot: any;
	public selectedMeetupDocData: any;
	private userRolesInMeetup: any;
	public isNotificationSectionVisible = false;

	constructor(
		private route: ActivatedRoute,
		public authService: AuthService,
		public apiService: ApiService,
		private auth: AngularFireAuth,
		public afs: AngularFirestore,
		private router: Router,
		private toastrService: ToastrService,
		public userService: UserService,
		private meetupInContextService: MeetupInContextService
	) {
		this.route.paramMap.subscribe(params => {
			this.meetingId = params.get('id');
			const meetingAfsDocument = this.afs.collection('Meetings').doc(this.meetingId);
			meetingAfsDocument.valueChanges().subscribe((snapshot) => {
				this.meetingDocData = snapshot;
				console.log('1')
			});
		});


		this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(firebaseUser => {
			this.loggedInUserDocData = firebaseUser;
			if (firebaseUser &&
				firebaseUser.meetupSubscriptionSnapshots &&
				firebaseUser.meetupSubscriptionSnapshots.length > 0) {
				this.meetupList = firebaseUser.meetupSubscriptionSnapshots;

				if (this.meetupId) {
					this.meetupSubscriptionSnapshot = firebaseUser.meetupSubscriptionSnapshots.find((m) => m.meetupId === this.meetupId);
				}

				let meetupDocumentSnapshot;
				if (!this.meetupInContextService.meetupInContext && !this.meetupId) {
					if (this.loggedInUserDocData.meetupSubscriptionSnapshots && this.loggedInUserDocData.meetupSubscriptionSnapshots.length > 0) {
						if(firebaseUser.lastMeetupInContextId){
							if(firebaseUser.meetupSubscriptionSnapshots.some(meetup => meetup.meetupId === firebaseUser.lastMeetupInContextId)){
								this.meetupSubscriptionSnapshot = firebaseUser.meetupSubscriptionSnapshots.find(meetupSnapshot => meetupSnapshot.meetupId === firebaseUser.lastMeetupInContextId)
							}
						} else {
							this.meetupSubscriptionSnapshot = firebaseUser.meetupSubscriptionSnapshots[0];
						}
						this.meetupId = this.meetupSubscriptionSnapshot.meetupId;
					}

					meetupDocumentSnapshot = this.afs.collection('OnlineMeetups').doc(this.meetupId);
					meetupDocumentSnapshot.snapshotChanges().subscribe((snapshot) => {
						this.selectedMeetupDocData = snapshot.payload.data();
						this.meetupInContextService.meetupInContextSubject.next(this.selectedMeetupDocData);
						console.log('meetup document based on id from url:', this.selectedMeetupDocData);
					});
				} else {
					this.selectedMeetupDocData = this.meetupInContextService.meetupInContext;
					this.meetupId = this.selectedMeetupDocData.id;
					console.log('meetup document from meetup-in-context-service', this.selectedMeetupDocData);
				}

				if (this.meetupSubscriptionSnapshot && this.meetupSubscriptionSnapshot.role && this.meetupSubscriptionSnapshot.role.length > 0) {
					this.userRolesInMeetup = this.meetupSubscriptionSnapshot.role;
				}
			}
		});
	}

	ngOnInit(): void {
		this.peopleForm = new FormGroup({
			sendNotification: new FormControl(false, Validators.required),
			message: new FormControl('', Validators.required),
			people: new FormArray([
				new FormGroup({
					name: new FormControl(''),
					email: new FormControl(''),
					phone: new FormControl(''),
				})
			])
		});

		this.peopleForm.controls['sendNotification'].valueChanges.subscribe(value => {
			this.isNotificationSectionVisible = value;
		});

	}

	get f() {
		return this.peopleForm.controls;
	}

	get people() {
		return this.f.people as FormArray;
	}

	addPeople(e) {
		e.preventDefault();
		this.people.push(
			new FormGroup({
				name: new FormControl(''),
				email: new FormControl(''),
				phone: new FormControl(''),
			})
		);
	}

	copyMeetingLinkToClipboard(e) {
		e.preventDefault();
		const link = document.location.origin + this.meetingDocData.joinURL;
		navigator.clipboard.writeText(link)
			.then(() => {
					this.toastrService.success('Invitation link copied', null, {closeButton: true});
				},
				(err) => {
					this.toastrService.error('Could not copy link');
				}
			);
	}

	sendInvitation() {
		console.log(this.peopleForm.value);
		// this.router.navigate([`/dashboard/meetings`]);
	}

	sendLater() {
		this.router.navigate([`/dashboard/meetings`]);
	}

	get formattedMeetingTime() {
		if (this.meetingDocData && this.meetingDocData.startsAt && this.meetingDocData.endsAt) {
			const start = moment.unix(this.meetingDocData.startsAt.seconds);
			const end = moment.unix(this.meetingDocData.endsAt.seconds);
			return `${start.format('MMMM Do')}, ${start.format('HH:mm')} - ${end.format('HH:mm A')}`;
		}
	}

	get isMeetingInPast(): boolean {
		if (this.meetingDocData && this.meetingDocData.endsAt) {
			return moment.unix(this.meetingDocData.endsAt).isBefore(moment());
		}
	}

	isMeetingInPastToggleDisabled(): string {
		return 'disabled';
	}

	ngOnDestroy(): void {
		this.loggedInUserFromAuthServiceSubscription.unsubscribe();
	}
}
