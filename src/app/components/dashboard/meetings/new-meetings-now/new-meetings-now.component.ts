import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../../../shared/services/auth.service';
import {ApiService} from '../../../../shared/services/api.service';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {Subscription} from "rxjs";
import {MeetupInContextService} from "../../../../shared/services/meetup-in-context.service";
import {Router} from "@angular/router";
import {DataService} from "../../../../shared/services/data.service";
import {UserService} from "../../../../shared/services/user.service";
import {AngularFirestore, DocumentData} from "@angular/fire/firestore";
import {firestore} from 'firebase';
import * as moment from 'moment';
import {ToastrService} from "ngx-toastr";

@Component({
	selector: 'app-new-meetings-now',
	templateUrl: './new-meetings-now.component.html',
	styleUrls: ['./new-meetings-now.component.scss']
})
export class NewMeetingsNowComponent implements OnInit {
	private loggedInUserFromAuthServiceSubscription: Subscription;
	private meetupList: any;
	private meetupSubscriptionSnapshot: any;
	private loggedInUserDocData: any;
	private meetupId: any;
	private selectedMeetupDocData: any;
	private userRolesInMeetup: any;
	public meetupMembers: any[]
	public trustedMembers: DocumentData[];
	showParticipantSelectionSection = false;
	showUserFilteringOption = false;
	config = [];
	meetingFormGroup = new FormGroup({
		name: new FormControl('', Validators.required),
		people: new FormControl('group'),
		allowGuests: new FormControl(false),
		isInstant: new FormControl('true'),
		dateValues: new FormGroup({
			startsAt: new FormControl(''),
			endsAt: new FormControl(''),
			recurring: new FormControl(false),
			// timezone: new FormControl('')
		}),
		trustedMembersCheckboxesArray: this.fb.array([]),
		addAttachments: new FormControl(false),
		recordMeeting: new FormControl(false)
	});
	private checkedList: [any];
	public searchTextControl: FormControl;
	public searchTextValue: string;


	constructor(
		public apiService: ApiService,
		private router: Router,
		private afs: AngularFirestore,
		private data: DataService,
		public userService: UserService,
		private authService: AuthService,
		private meetupInContextService: MeetupInContextService,
		private fb: FormBuilder,
		private toastrService: ToastrService
	) {
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
						});
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
					});
				}

				if (this.meetupSubscriptionSnapshot && this.meetupSubscriptionSnapshot.role && this.meetupSubscriptionSnapshot.role.length > 0) {
					this.userRolesInMeetup = this.meetupSubscriptionSnapshot.role;
				}
			}
		});
	}


	createParticipants(participantsInputs) {
		const arr = participantsInputs.map(participant => {
			return new FormControl(false);
		});
		return new FormArray(arr);
	}

	openParticipantSelectionPanel($event) {
		$event.preventDefault();
		this.showParticipantSelectionSection = true;
	}

	closeParticipantSelectionPanel() {
		this.showParticipantSelectionSection = false;
	}

	filterPanel($event) {
		$event.preventDefault();
		this.showUserFilteringOption = true;
	}

	ngOnInit(): void {
		this.searchTextControl = new FormControl('', Validators.required);
		this.searchTextControl.valueChanges.subscribe(searchText => {
			console.log('searchText:' + searchText);
			this.searchTextValue = searchText;
		});
	}

	enterPressed(): void {
		console.log('enter pressed with searchText:' + this.searchTextValue);
		if (this.searchTextValue) {
			const trimmedSearchTextValue = this.searchTextValue.trim();
			if (trimmedSearchTextValue.length > 2) {
				console.log('Greater than 2 characters - need to search for:' + this.searchTextValue);
				this.afs.collection('OnlineMeetups')
					.doc(this.selectedMeetupDocData.id).collection('members', ref =>
					ref.where('isTrusted', '==', true).where('displayNameKeywords', 'array-contains', this.searchTextValue.toLowerCase())).snapshotChanges().subscribe((memberList) => {
					this.trustedMembers = memberList.filter((meetingDocChangeAction) =>
						meetingDocChangeAction.payload.doc.data().userId !== this.loggedInUserDocData.uid
					).map((meetingDocChangeAction) => {
						if (meetingDocChangeAction.payload.doc.data().userId !== this.loggedInUserDocData.uid) {
							return meetingDocChangeAction.payload.doc.data()
						}
					});
				});
			}
		} else if (!this.searchTextValue || this.searchTextValue.length === 0) {
			console.log('0 length');
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
			});
		}
	}

	submitFormToCreateMeeting() {
		if (this.meetingFormGroup.invalid) {
			return;
		}

		if(!this.selectedMeetupDocData){
			this.toastrService.info('Please join/create a meetup to create a meeting!', null, {closeButton: true});
		}

		let formData = this.meetingFormGroup.value;
		let newMeetingObject: any = {
			name: formData.name,
			createdAt: firestore.FieldValue.serverTimestamp(),
			hostUid: this.loggedInUserDocData.uid,
			meetupId: this.selectedMeetupDocData.id
		}

		if (formData.isInstant === 'true') {
			newMeetingObject.isInstant = true;
		} else {
			newMeetingObject.isInstant = false;
		}

		if (formData.allowGuests === true) {
			newMeetingObject.allowGuests = true;
		} else {
			newMeetingObject.allowGuests = false;
		}

		if (!newMeetingObject.isInstant) {
			newMeetingObject.startsAt = firestore.FieldValue.serverTimestamp();
			newMeetingObject.endsAt = firestore.Timestamp.fromDate(moment().add(39, "minutes").toDate());
			newMeetingObject.isStarted = false;
			newMeetingObject.hasEnded = false;
		} else {
			newMeetingObject.startsAt = null;
			newMeetingObject.endsAt = null;
			newMeetingObject.isStarted = false;
			newMeetingObject.hasEnded = false;
		}

		newMeetingObject.participantsUids = formData.trustedMembersCheckboxesArray;

		const meetingDocReference = this.afs.collection('Meetings');
		meetingDocReference.add(newMeetingObject).then(response => {
			this.router.navigate([`/dashboard/meeting/${response.id}/invite`]);
		});
	}


	get trustedMembersCheckboxesArray(): FormArray {
		return this.meetingFormGroup.get('trustedMembersCheckboxesArray') as FormArray;
	}

	addTrustedMembersCheckbox() {
		//this.trustedMembersCheckboxesArray.push(new FormControl({selected:false}));
	}

	onCheckboxChange(member, event) {
		if (event.target.checked) {
			this.trustedMembersCheckboxesArray.push(new FormControl(event.target.value));
		} else {
			let i: number = 0;
			this.trustedMembersCheckboxesArray.controls.forEach((item: FormControl) => {
				if (item.value == event.target.value) {
					this.trustedMembersCheckboxesArray.removeAt(i);
					return;
				}
				i++;
			});
		}
		console.log('trustedMembersCheckboxesArray' + this.trustedMembersCheckboxesArray);
	}

	ngOnDestroy(): void {
		this.loggedInUserFromAuthServiceSubscription.unsubscribe();
	}
}
