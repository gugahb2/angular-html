import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {ActivatedRoute, NavigationExtras, Router} from '@angular/router';
import {ApiService} from '../../../shared/services/api.service';
import {AngularFirestore, DocumentData} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {AuthService} from '../../../shared/services/auth.service';
import * as moment from 'moment';
import {async} from '@angular/core/testing';
import {User} from 'firebase';
import {Observable, Subscription} from 'rxjs';
import {MeetupInContextService} from '../../../shared/services/meetup-in-context.service';
import {map, switchMap} from "rxjs/operators";
import {DocumentChangeAction} from "@angular/fire/firestore/interfaces";
import {AngularFireFunctions} from "@angular/fire/functions";

@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
	config = [];
	meetupId;
	meetupSubscriptionSnapshot: any;
	userCollection: any;
	meetupRole: string;
	upcomingMeetings: Observable<any[]>;
	meetupList: any;
	loggedInUserFromAuthServiceSubscription: Subscription;
	selectedMeetupDocData: any;
	loggedInUserDocData: any;
	private meetupInContextServiceSubscription: Subscription;
	public recentChatsSubscription: Subscription;
	public recentChatsList: any[];
	public trustedMembers: DocumentData[];

	constructor(
		public route: ActivatedRoute,
		private api: ApiService,
		public afs: AngularFirestore,
		private auth: AngularFireAuth,
		private router: Router,
		public authService: AuthService,
		public meetupInContextService: MeetupInContextService,
		private ref: ChangeDetectorRef
	) {
		this.route.paramMap.subscribe((params) => {
			this.meetupId = params.get('id');
		});

		this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(firebaseUser => {
			this.loggedInUserDocData = firebaseUser;
			if (firebaseUser &&
				firebaseUser.meetupSubscriptionSnapshots &&
				firebaseUser.meetupSubscriptionSnapshots.length > 0) {
				this.meetupList = firebaseUser.meetupSubscriptionSnapshots;
				this.meetupSubscriptionSnapshot = firebaseUser.meetupSubscriptionSnapshots.find((m) => m.meetupId === this.meetupId);
				if (this.meetupSubscriptionSnapshot && this.meetupSubscriptionSnapshot.role && this.meetupSubscriptionSnapshot.role.length > 0) {
					this.meetupRole = this.meetupSubscriptionSnapshot.role[0];
				}


				let meetupDocumentSnapshot;
				if (!this.meetupInContextService.meetupInContext) {
					meetupDocumentSnapshot = this.afs.collection('OnlineMeetups').doc(this.meetupId);
					meetupDocumentSnapshot.snapshotChanges().subscribe((snapshot) => {
						this.selectedMeetupDocData = snapshot.payload.data();
						this.meetupInContextService.meetupInContextSubject.next(this.selectedMeetupDocData);
						//ddconsole.log('meetup document based on id from url:', this.selectedMeetupDocData);


						this.afs.collection('OnlineMeetups')
							.doc(this.selectedMeetupDocData.id).collection('members', ref =>
							ref.where('isTrusted', '==', true)).snapshotChanges().subscribe((memberList) => {
							this.trustedMembers = memberList.filter((meetingDocChangeAction) =>
								meetingDocChangeAction.payload.doc.data().userId !== this.loggedInUserDocData.uid
							).map((meetingDocChangeAction) => {
								if (meetingDocChangeAction.payload.doc.data().userId !== this.loggedInUserDocData.uid) {
									return meetingDocChangeAction.payload.doc.data()
								}
							});
							this.recentChatsSubscription = this.afs.collection('OnlineMeetups').doc(this.selectedMeetupDocData.id)
								.collection('members').doc(this.loggedInUserDocData.uid)
								.snapshotChanges()
								.subscribe((memberDocumentSnapshot: any) => {
									this.recentChatsList = memberDocumentSnapshot.payload.data()
										.recentChats?.filter(recentChat => !recentChat.isGroupChat)
										.map((recentChat) => {
											let chatterItem = {
												chatterNames: recentChat.userSnapshots.reduce((accumulatedStr, currentValue, currentIndex, array) => {
														if (this.loggedInUserDocData.uid !== currentValue.userId) {
															return (accumulatedStr === '' ? (accumulatedStr) : accumulatedStr + ',') + currentValue.displayName
														} else {
															return accumulatedStr;
														}
													}, ''
												),
												recentMessages: recentChat.recentMessages[0].text,
												userImages: recentChat.userSnapshots
													.filter(userSnapshot => this.loggedInUserDocData.uid !== userSnapshot.userId)
													.map(userSnapshot => userSnapshot.photoURL),
												chatId: recentChat.chatId,
												userIds: recentChat
													.userSnapshots.filter(userSnapshot => this.loggedInUserDocData.uid !== userSnapshot.userId)
													.map(userSnapshot => userSnapshot.userId)
											}
											console.log('chatterItem:' + JSON.stringify(chatterItem));
											return chatterItem;
										});
									ref.detectChanges();
								});

						});

						this.upcomingMeetings = this.afs.collectionGroup('participants', ref =>
							ref.where('userId', '==', this.loggedInUserDocData.uid).where('meetupId', '==', this.selectedMeetupDocData.id))
							.snapshotChanges()
							.pipe(
								map(meetings => meetings.map(a => {
										const data: any = a.payload.doc.data(); // DB Questions
										const id = a.payload.doc.id;
										data.createdAgo = moment.utc(moment(moment(), "DD/MM/YYYY HH:mm").diff(moment(moment.unix(data.createdAt.seconds), "DD/MM/YYYY HH:mm"))).format("HH [hrs] mm [mins]")
										return data;
									})
										.filter(meeting => {
												//console.log(JSON.stringify(meeting));
												if (meeting.hasEnded) {
													return false;
												} else {
													return meeting.createdAt ? moment.unix(meeting.createdAt.seconds).isAfter(moment().subtract(12, 'hours')) : false
												}
											}
										)
								)
							);
					});
				} else {
					this.selectedMeetupDocData = this.meetupInContextService.meetupInContext;

					this.afs.collection('OnlineMeetups')
						.doc(this.selectedMeetupDocData.id).collection('members', ref =>
						ref.where('isTrusted', '==', true)).snapshotChanges().subscribe((memberList) => {
						this.trustedMembers = memberList.filter((meetingDocChangeAction) =>
							meetingDocChangeAction.payload.doc.data().userId !== this.loggedInUserDocData.uid
						).map((meetingDocChangeAction) => {
							if (meetingDocChangeAction.payload.doc.data().userId !== this.loggedInUserDocData.uid) {
								return meetingDocChangeAction.payload.doc.data()
							}
						});
						this.recentChatsSubscription = this.afs.collection('OnlineMeetups').doc(this.selectedMeetupDocData.id)
							.collection('members').doc(this.loggedInUserDocData.uid)
							.snapshotChanges()
							.subscribe((memberDocumentSnapshot: any) => {
								this.recentChatsList = memberDocumentSnapshot.payload.data()
									.recentChats?.filter(recentChat => !recentChat.isGroupChat)
									.map((recentChat) => {
										let chatterItem = {
											chatterNames: recentChat.userSnapshots.reduce((accumulatedStr, currentValue, currentIndex, array) => {
													if (this.loggedInUserDocData.uid !== currentValue.userId) {
														return (accumulatedStr === '' ? (accumulatedStr) : accumulatedStr + ',') + currentValue.displayName
													} else {
														return accumulatedStr;
													}
												}, ''
											),
											recentMessages: recentChat.recentMessages[0].text,
											userImages: recentChat.userSnapshots
												.filter(userSnapshot => this.loggedInUserDocData.uid !== userSnapshot.userId)
												.map(userSnapshot => userSnapshot.photoURL),
											chatId: recentChat.chatId,
											userIds: recentChat
												.userSnapshots.filter(userSnapshot => this.loggedInUserDocData.uid !== userSnapshot.userId)
												.map(userSnapshot => userSnapshot.userId)
										}
										console.log('chatterItem:' + JSON.stringify(chatterItem));
										return chatterItem;
									});
								ref.detectChanges();
							});

					});

					this.upcomingMeetings = this.afs.collectionGroup('participants', ref =>
						ref.where('userId', '==', this.loggedInUserDocData.uid).where('meetupId', '==', this.selectedMeetupDocData.id))
						.snapshotChanges()
						.pipe(
							map(meetings => meetings.map(a => {
									const data: any = a.payload.doc.data(); // DB Questions
									const id = a.payload.doc.id;
									data.createdAgo = moment.utc(moment(moment(), "DD/MM/YYYY HH:mm").diff(moment(moment.unix(data.createdAt.seconds), "DD/MM/YYYY HH:mm"))).format("HH [hrs] mm [mins]")
									return data;
								})
									.filter(meeting => {
											//console.log(JSON.stringify(meeting));
											if (meeting.hasEnded) {
												return false;
											} else {
												return meeting.createdAt ? moment.unix(meeting.createdAt.seconds).isAfter(moment().subtract(12, 'hours')) : false
											}
										}
									)
							)
						);

				}
			}
		});

		this.meetupInContextServiceSubscription = this.meetupInContextService.meetupInContextSubject.subscribe(meetupInContext => {
			this.selectedMeetupDocData = meetupInContext;
		});
	}

	ngOnInit(): void {
	}

	getUserMeetingList() {
		if (this.userCollection &&
			this.userCollection.meetingSubscriptionSnapshots &&
			this.userCollection.meetingSubscriptionSnapshots.length > 0 && this.meetupId) {
			const meetings = this.userCollection.meetingSubscriptionSnapshots;
			this.upcomingMeetings = meetings.filter(meeting => {
				return meeting.meetupId === this.meetupId;
			});
		} else {
			this.upcomingMeetings = null;
		}
	}

	joinMeeting(e, meeting) {
		e.preventDefault();
		//console.log(meeting);
	}

	inviteMeeting(e, meeting) {
		e.preventDefault();
		this.router.navigate([`/dashboard/meeting/${meeting.meetingId}/invite`]);
	}

	RedirectBack() {
	}

	async changeMeetup(m) {
		if (m.meetupId !== this.meetupId) {
			this.meetupId = m.meetupId;
			this.getUserMeetingList();
			const meetupDocumentSnapshot = this.afs.collection('OnlineMeetups').doc(this.meetupId);
			meetupDocumentSnapshot.snapshotChanges().subscribe((snapshot) => {
				this.selectedMeetupDocData = snapshot.payload.data();
				this.meetupInContextService.meetupInContextSubject.next(this.selectedMeetupDocData);
				//ddconsole.log('meetup document after change of meetup in dropdown:', this.selectedMeetupDocData);
			});
			if (this.loggedInUserDocData &&
				this.loggedInUserDocData.meetupSubscriptionSnapshots &&
				this.loggedInUserDocData.meetupSubscriptionSnapshots.length > 0) {
				this.meetupList = this.loggedInUserDocData.meetupSubscriptionSnapshots;
				this.meetupSubscriptionSnapshot = this.loggedInUserDocData.meetupSubscriptionSnapshots.find((meetupObj) => meetupObj.meetupId === this.meetupId);
				if (this.meetupSubscriptionSnapshot && this.meetupSubscriptionSnapshot.role && this.meetupSubscriptionSnapshot.role.length > 0) {
					this.meetupRole = this.meetupSubscriptionSnapshot.role[0];
				}
			}
			this.router.navigateByUrl(`/dashboard/meetup/${m.meetupId}`);
		}
	}

	Date(date) {
		if (date && date.seconds) {
			const now = moment.unix(date.seconds);
			return now.format('MMMM Do, HH.mm A');
		}
		return null;
	}

	get hasAccessToMeetup(): boolean {
		return this.meetupList && this.meetupList.length > 0 && !!this.meetupList.find(m => m.meetupId === this.meetupId);
	}

	getSelectedMeetupNameFontSize(): string {
		if (this.selectedMeetupDocData && this.selectedMeetupDocData.name && (this.selectedMeetupDocData.name.length > 18)) {
			return 'font-size:1.1rem';
		} else {
			return 'font-size:1.3rem';
		}
	}

	async meetingInviteLinkClicked(e, meeting) {
		e.preventDefault();
		await this.router.navigate([`/dashboard/meeting/${meeting.meetingId}/invite`]);
	}

	async openRecentChatInChatSection(chatItem) {
		const navigationExtras: NavigationExtras = {state: {chatId: chatItem.chatId}};
		await this.router.navigate([`/dashboard/chat`], navigationExtras);
	}

	getMemberOnlineStatus(recentChatItem): string {
		let trustedMemberRecordForChatter = this.trustedMembers?.find(member => member.userId === recentChatItem.userIds[0]);
		if (trustedMemberRecordForChatter) {
			return trustedMemberRecordForChatter.onlineStatus ? trustedMemberRecordForChatter.onlineStatus : "offline";
		} else {
			return "offline";
		}
	}

	openNewWindowNGoToMeeting(e, meeting, eventType, isMeetingCreator) {
		e.preventDefault();
		if (eventType === 'join' && !isMeetingCreator) {
			console.log(`Non-creator join url: zoommtg://zoom.us/join?confno=${meeting.zoomMeetingId}&pwd=${meeting.zoomMeetingPassword}&uname=${this.loggedInUserDocData.displayName}`);
			window.open(`zoommtg://zoom.us/join?confno=${meeting.zoomMeetingId}&pwd=${meeting.zoomMeetingPassword}&uname=${this.loggedInUserDocData.displayName}`, '_blank');
		} else if (eventType === 'join' && isMeetingCreator) {
			console.log(`Non-creator join url: zoommtg://zoom.us/join?confno=${meeting.zoomMeetingId}&pwd=${meeting.zoomMeetingPassword}&uname=${this.loggedInUserDocData.displayName}`);
			window.open(meeting.zoomMeetingJoinUrl, '_blank');
		} else if (eventType === 'start') {
			window.open(meeting.zoomMeetingStartUrl, '_blank');
		}
	}

	ngOnDestroy = (): void => {
		this.loggedInUserFromAuthServiceSubscription.unsubscribe();
		this.meetupInContextServiceSubscription.unsubscribe();
	}
}
