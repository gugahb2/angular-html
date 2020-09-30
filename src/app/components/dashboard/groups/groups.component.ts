import {ChangeDetectorRef, Component, OnInit} from "@angular/core";
import {MeetupInContextService} from "../../../shared/services/meetup-in-context.service";
import {AuthService} from "../../../shared/services/auth.service";
import {AngularFirestore, DocumentData} from "@angular/fire/firestore";
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import {ToastrService} from "ngx-toastr";
import {AngularFireFunctions} from "@angular/fire/functions";
import {NavigationExtras, Router} from "@angular/router";
import {Subscription} from "rxjs";

@Component({
	selector: "app-groups",
	templateUrl: "./groups.component.html",
	styleUrls: ["./groups.component.scss"],
})
export class GroupsComponent implements OnInit {
	loggedInUserFromAuthServiceSubscription: Subscription;
	loggedInUserDocData: any;
	meetupList: any;
	meetupId: any;
	meetupSubscriptionSnapshot: any;
	meetupRole: any;
	selectedMeetupDocData: any;
	groupsList: any[];
	searchTextControl: FormControl;
	searchTextValue: string;
	searchedGroupsList: DocumentData[];
	config = [];

	constructor(
		public meetupInContextService: MeetupInContextService,
		public authService: AuthService,
		private afs: AngularFirestore,
		public fb: FormBuilder,
		private toastrService: ToastrService,
		private fns: AngularFireFunctions,
		private ref: ChangeDetectorRef,
		private router: Router
	) {
		const navigation = this.router.getCurrentNavigation();

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
							if (this.meetupSubscriptionSnapshot && this.meetupSubscriptionSnapshot.role && this.meetupSubscriptionSnapshot.role.length > 0) {
								this.meetupRole = this.meetupSubscriptionSnapshot.role[0];
							}
						}
						this.meetupId = this.meetupSubscriptionSnapshot.meetupId;
					}

					meetupDocumentSnapshot = this.afs.collection('OnlineMeetups').doc(this.meetupId);
					meetupDocumentSnapshot.snapshotChanges().subscribe((snapshot) => {
						this.selectedMeetupDocData = snapshot.payload.data();
						this.meetupInContextService.meetupInContextSubject.next(this.selectedMeetupDocData);

						this.afs.collection('Groups', ref =>
							ref.where('meetupId', '==', this.selectedMeetupDocData.id))
							.snapshotChanges()
							.subscribe((groupDocChangeActionList) => {
								this.groupsList = groupDocChangeActionList.map((groupDocChangeAction) => {
									let groupObject: any = groupDocChangeAction.payload.doc.data();
									groupObject.id = groupDocChangeAction.payload.doc.id;
									return groupObject;
								});
							});


					});
				} else {
					this.selectedMeetupDocData = this.meetupInContextService.meetupInContext;
					this.meetupSubscriptionSnapshot = firebaseUser.meetupSubscriptionSnapshots.find((m) => m.meetupId === this.selectedMeetupDocData.id);
					this.meetupId = this.meetupSubscriptionSnapshot.meetupId;

					if (this.meetupSubscriptionSnapshot && this.meetupSubscriptionSnapshot.role && this.meetupSubscriptionSnapshot.role.length > 0) {
						this.meetupRole = this.meetupSubscriptionSnapshot.role[0];
					}

					this.afs.collection('Groups', ref =>
						ref.where('meetupId', '==', this.selectedMeetupDocData.id))
						.snapshotChanges()
						.subscribe((groupList) => {
							this.groupsList = groupList.map((groupDocChangeAction) => {
								let groupObject: any = groupDocChangeAction.payload.doc.data();
								groupObject.id = groupDocChangeAction.payload.doc.id;
								return groupObject;
							});
						});
				}
			}
		});
	}

	status = false;

	async openGroupChatInChatSection(group) {
		const navigationExtras: NavigationExtras = {state: {groupId: group.id, groupName: group.name}};
		await this.router.navigate([`/dashboard/chat`], navigationExtras);
	}

	openFindGroupsPanel($event) {
		$event.preventDefault();
		this.status = true;
	}

	closeFindGroupsPanel($event) {
      $event.preventDefault();
      this.status = false;
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
				this.afs.collection('Groups', ref =>
					ref.where('meetupId', '==', this.selectedMeetupDocData.id).where('searchKeywords', 'array-contains', this.searchTextValue.toLowerCase()))
					.snapshotChanges()
					.subscribe((groupList) => {
					this.searchedGroupsList = groupList.map((groupDocChangeAction) => {
						let groupObject: any = groupDocChangeAction.payload.doc.data();
						groupObject.id = groupDocChangeAction.payload.doc.id;
						return groupObject;
					});
				});
			}
		} else if (!this.searchTextValue || this.searchTextValue.length === 0) {
			this.searchedGroupsList = this.groupsList;
		}
	}
}
