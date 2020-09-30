import {Component, OnInit} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import * as moment from 'moment';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {DataService} from '../../../shared/services/data.service';
import {UserService} from '../../../shared/services/user.service';
import {AuthService} from "../../../shared/services/auth.service";
import {Observable, Subscription} from "rxjs";
import {MeetupInContextService} from "../../../shared/services/meetup-in-context.service";
import {ToastrService} from "ngx-toastr";

@Component({
	selector: 'app-meetings',
	templateUrl: './meetings.component.html',
	styleUrls: ['./meetings.component.scss']
})
export class MeetingsComponent implements OnInit {
	user: any;
	userMeetings: any;
	meetupId: string;
	meetupDocData: any;
	meetingDocData: any;
	showPastMeetings = false;
	meetingsForLoggedInUserForMeetupInContext: Observable<any[]>;
	private loggedInUserFromAuthServiceSubscription: Subscription;
	public loggedInUserDocData: any;
	private meetupList: any;
	private meetupSubscriptionSnapshot: any;
	private userRolesInMeetup: any;
	public selectedMeetupDocData: any;
	private meetingsList: any;

	constructor(
		private auth: AngularFireAuth,
		private router: Router,
		public http: HttpClient,
		private data: DataService,
		public userService: UserService,
		private authService: AuthService,
		private meetupInContextService: MeetupInContextService,
		private afs: AngularFirestore,
		private dataRoute: ActivatedRoute,
		private toastrService: ToastrService
	) {
		let failureMessage = this.dataRoute.snapshot.params['showFailureMesssage'];
		if (failureMessage) {
			let messageToDisplay = JSON.parse(failureMessage);
			console.log('--------------:' + messageToDisplay);
			this.toastrService.error(failureMessage);
		}

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
						if (firebaseUser.lastMeetupInContextId) {
							if (firebaseUser.meetupSubscriptionSnapshots.some(meetup => meetup.meetupId === firebaseUser.lastMeetupInContextId)) {
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
						this.loadMeetingsForDisplay();
					});
				} else {
					this.selectedMeetupDocData = this.meetupInContextService.meetupInContext;
					this.meetupId = this.selectedMeetupDocData.id;
					this.loadMeetingsForDisplay();
				}

				if (this.meetupSubscriptionSnapshot && this.meetupSubscriptionSnapshot.role && this.meetupSubscriptionSnapshot.role.length > 0) {
					this.userRolesInMeetup = this.meetupSubscriptionSnapshot.role;
				}

			}
		});
	}

	ngOnInit(): void {
	}


	loadMeetingsForDisplay() {
		this.afs.collectionGroup('participants', ref =>
			ref.where('userId', '==', this.loggedInUserDocData.uid).where('meetupId', '==', this.selectedMeetupDocData.id))
			.snapshotChanges().subscribe((meetingsList) => {
			this.meetingsList = meetingsList.map((meetingDocChangeAction) =>
				meetingDocChangeAction.payload.doc.data());
			this.groupMeetings();
		});
	}

	/**
	 * Group the meetings snapshot using the start and end time of the meeting
	 */
	groupMeetings() {
		// if meeting snapshot is present
		if (this.meetingsList && this.meetingsList.length > 0) {

			let groupsArray = [];

			// loop through meetings
			for (let meeting of this.meetingsList) {
				// get the formatted time to show in table
				meeting.time = this.getFormattedMeetingTime(meeting.startsAt, meeting.endsAt);
				meeting = {...meeting, ...this.getCalculatedMeetingAttributes(meeting)};
				let groupName = '';
				let date = null;
				let createdAgo = '';
				// groupsArray the meetings according to the time
				if (meeting && meeting.startsAt && meeting.startsAt.seconds) {
					groupName = moment.unix(meeting.startsAt.seconds).format('ddd, MMM Do');
					date = moment.unix(meeting.startsAt.seconds).format('YYYY-MM-DD');
				} else if (meeting.createdAt && moment.unix(meeting.createdAt.seconds).isAfter(moment().subtract(24, 'hours'))) {
					groupName = moment.unix(meeting.createdAt.seconds).format('ddd, MMM Do');
					date = moment.unix(meeting.createdAt.seconds).format('YYYY-MM-DD');
					meeting.createdAgo = moment.utc(moment(moment(), "DD/MM/YYYY HH:mm").diff(moment(moment.unix(meeting.createdAt.seconds), "DD/MM/YYYY HH:mm"))).format("HH [hrs] mm [mins]");
				} else if (meeting.createdAt && moment.unix(meeting.createdAt.seconds).isBefore(moment().subtract(24, 'hours'))) {
					groupName = moment.unix(meeting.createdAt.seconds).format('ddd, MMM Do');
					date = moment.unix(meeting.createdAt.seconds).format('YYYY-MM-DD');
					meeting.createdAgo = moment.utc(moment(moment(), "DD/MM/YYYY HH:mm").diff(moment(moment.unix(meeting.createdAt.seconds), "DD/MM/YYYY HH:mm"))).format("DD [days]");
				} else {
					groupName = 'Not scheduled';
				}
				const existingGroupFound = groupsArray.find(g => g.groupName === groupName);
				if (existingGroupFound) {
					existingGroupFound.items.push(meeting);
				} else {
					groupsArray.push({
						groupName,
						date,
						createdAgo,
						items: [meeting]
					});
				}
			}
			// sort the inner list of meetings in a group by date
			groupsArray.forEach(function (group) {
				if (group && group.items) {
					group.items.sort((a, b) => {
						// @ts-ignore
						if (a.endsAt && b.endsAt) {
							return moment.unix(a.endsAt.seconds).isBefore(moment.unix(b.endsAt.seconds)) ? 1 : -1;
						} else if (a.createdAt && b.createdAt) {
							return moment.unix(a.createdAt.seconds).isBefore(moment.unix(b.createdAt.seconds)) ? 1 : -1;
						} else {
							return 1;
						}
					});
				}
			});
			// sort the outer list of groups by date
			groupsArray.sort((a, b) => {
				// @ts-ignore
				if (a.date && b.date) {
					return moment(a.date).isBefore(moment(b.date)) ? 1 : -1;
				} else {
					return 1;
				}
			});
			// get the non-scheduled item
			const notScheduledIndex = groupsArray.findIndex(g => !g.date);
			// if non-scheduled item
			if (notScheduledIndex > -1) {
				// sort to last entry
				const notScheduled = groupsArray.splice(notScheduledIndex, 1);
				groupsArray = [...groupsArray, ...notScheduled];
			}
			this.setGroupAsPast(groupsArray);
			// set the grouped meetings to the variable, it will show in view
			this.userMeetings = groupsArray;
		}
	}

	//Set flags to groups to check if the group is past
	setGroupAsPast(group) {
		group.map(g => {
			g.isPastMeeting = g.items && g.items.length > 0 && !!g.items.every(i => i.isPastMeeting);
		});
	}

	//Get moment object of date
	getDate(date) {
		return date ? moment(date) : 1;
	}

	async meetingInviteLinkClicked(e, meeting) {
		e.preventDefault();
		await this.router.navigate([`/dashboard/meeting/${meeting.meetingId}/invite`]);
	}

	get isUserGuest(): boolean {
		return this.loggedInUserDocData.isAnonymous;
	}

	getFormattedMeetingTime(startAt, endAt) {
		if (startAt && endAt && startAt.seconds && endAt.seconds) {
			const start = moment.unix(startAt.seconds);
			const end = moment.unix(endAt.seconds);
			return `${start.format('HH:mm')} - ${end.format('HH:mm A')}`;
		} else {
			return 'Not scheduled';
		}
	}

	getCalculatedMeetingAttributes(meeting) {
		const object = {
			isPastMeeting: false,
			hasExpired: false
		};
		const time = moment();
		const createdTime = moment.unix(meeting.createdAt.seconds);
		if ((meeting.startsAt && meeting.endsAt && meeting.startsAt.seconds && meeting.endsAt.seconds)) {

			const startTime = moment.unix(meeting.startsAt.seconds);
			const endTime = moment.unix(meeting.endsAt.seconds);

			if (time < startTime) { // if the meeting is in future
			} else if (time.isAfter(startTime) && (time.isBefore(endTime))) { // on going meeting
			} else { // past meeting
				object.isPastMeeting = true;
			}
		} else {
			if ((time > createdTime.add(12, 'hours')) && !meeting.isStarted) { // if the meeting is created in past 12 hours
				object.isPastMeeting = true;
				object.hasExpired = true;
			}
		}
		return object;
	}

	openNewWindowNGoToMeeting(e, meeting, eventType, isMeetingCreator) {
		e.preventDefault();
		console.log(11111111111)
		if (eventType === 'join' && !isMeetingCreator) {
			console.log(222222222222)
			console.log(`Non-creator join url: zoommtg://zoom.us/join?confno=${meeting.zoomMeetingId}&pwd=${meeting.zoomMeetingPassword}&uname=${this.loggedInUserDocData.displayName}`);
			window.open(`zoommtg://zoom.us/join?confno=${meeting.zoomMeetingId}&pwd=${meeting.zoomMeetingPassword}&uname=${this.loggedInUserDocData.displayName}`, '_blank');
		} else if (eventType === 'join' && isMeetingCreator) {
			console.log(`Non-creator join url: zoommtg://zoom.us/join?confno=${meeting.zoomMeetingId}&pwd=${meeting.zoomMeetingPassword}&uname=${this.loggedInUserDocData.displayName}`);
			window.open(meeting.zoomMeetingJoinUrl, '_blank');
		} else if (eventType === 'start') {
			window.open(meeting.zoomMeetingStartUrl, '_blank');
		}
	}


	/**
	 * Show past meetings in the list
	 * Past meetings will be hidden in the list
	 */
	ShowPastMeetings(e) {
		e.preventDefault();
		this.showPastMeetings = !this.showPastMeetings;
	}

	ngOnDestroy(): void {
		this.loggedInUserFromAuthServiceSubscription.unsubscribe();
	}
}
