import {Component, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {ApiService} from '../../shared/services/api.service';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {AuthService} from '../../shared/services/auth.service';
import {MeetupInContextService} from '../../shared/services/meetup-in-context.service';
import {ToastrService} from "ngx-toastr";
import {first} from "rxjs/operators";
import {AngularFireFunctions} from "@angular/fire/functions";

@Component({
	selector: 'app-pending-member-review',
	templateUrl: './pending-member-review.component.html',
	styleUrls: ['./pending-member-review.component.scss']
})
export class PendingMemberReviewComponent implements OnInit {
	meetupId;
	meetupSubscriptionSnapshot: any;
	meetupRole: string;
	meetupList: any;
	loggedInUserFromAuthServiceSubscription: Subscription;
	selectedMeetupDocData: any;
	loggedInFirebaseUser: any;
	private meetupInContextServiceSubscription: Subscription;
	membersToReview: any;

	constructor(
		public route: ActivatedRoute,
		private api: ApiService,
		public afs: AngularFirestore,
		private auth: AngularFireAuth,
		private router: Router,
		public authService: AuthService,
		public meetupInContextService: MeetupInContextService,
		private toastrService: ToastrService,
		private fns: AngularFireFunctions) {

		this.route.paramMap.subscribe((params) => {
			this.meetupId = params.get('id');
		});


		this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(firebaseUser => {
			this.loggedInFirebaseUser = firebaseUser;
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
						console.log('meetup document based on id from url:', this.selectedMeetupDocData);
						this.afs.collection('OnlineMeetups')
							.doc(this.selectedMeetupDocData.id).collection('members', ref =>
							ref.where('isTrusted', '==', false).where('isTrustReviewed', '==', false)).snapshotChanges().subscribe((memberList) => {
							this.membersToReview = memberList.map((meetingDocChangeAction) => {
								let memberDocData = meetingDocChangeAction.payload.doc.data();
								let joiningQuestionsArrayFlattened = '';
								memberDocData.joiningQnA?.forEach(function (joiningQnA, index) {
									if (index == 1) {
										joiningQuestionsArrayFlattened += `<br/>`;
									}
									joiningQuestionsArrayFlattened += joiningQnA.question;
									joiningQuestionsArrayFlattened += '? ';
									joiningQuestionsArrayFlattened += joiningQnA.answer;

								});

								if (joiningQuestionsArrayFlattened === '') {
									joiningQuestionsArrayFlattened = 'N/A';
								}

								memberDocData.joiningQnA = joiningQuestionsArrayFlattened;
								return memberDocData;
							});
						});
					});
				} else {
					this.selectedMeetupDocData = this.meetupInContextService.meetupInContext;
					console.log('meetup document from meetup-in-context-service', this.selectedMeetupDocData);
					/*this.membersToReview = this.afs.collection('OnlineMeetups')
						.doc(this.selectedMeetupDocData.id).collection('members', ref =>
							ref.where('isTrusted', '==', false)/!*.where('alreadyReviewed','==', false)*!/).valueChanges();*/
					this.afs.collection('OnlineMeetups')
						.doc(this.selectedMeetupDocData.id).collection('members', ref =>
						ref.where('isTrusted', '==', false).where('isTrustReviewed', '==', false)).snapshotChanges().subscribe((memberList) => {
						this.membersToReview = memberList.map((meetingDocChangeAction) =>
							meetingDocChangeAction.payload.doc.data());
						this.membersToReview = memberList.map((meetingDocChangeAction) => {
							let memberDocData = meetingDocChangeAction.payload.doc.data();
							let joiningQuestionsArrayFlattened = '';
							memberDocData.joiningQnA?.forEach(function (joiningQnA, index) {
								if (index == 1) {
									joiningQuestionsArrayFlattened += `<br/>`;
								}
								joiningQuestionsArrayFlattened += joiningQnA.question;
								joiningQuestionsArrayFlattened += '? ';
								joiningQuestionsArrayFlattened += joiningQnA.answer;
							});

							if (joiningQuestionsArrayFlattened === '') {
								joiningQuestionsArrayFlattened = 'N/A';
							}
							memberDocData.joiningQnA = joiningQuestionsArrayFlattened;
							return memberDocData;
						});
					});
				}
			}
		});


	}

	ngOnInit(): void {
	}

	declineAsTrusted(): void {
		this.toastrService.success('Member is set as NON-TRUSTED and removed from review list.', null, {closeButton: true});
	}

	markAsTrusted(member): void {
		const callable = this.fns.httpsCallable(`markMemberAsTrusted`);
		try {
			let apiResponse = callable({
				meetupId: this.selectedMeetupDocData.id,
				memberUid: member.userId
			})
				.pipe(first())
				.subscribe(resp => {
					console.log({resp});
					this.toastrService.success('Member is marked as TRUSTED and removed from review list.', null, {closeButton: true});
				}, err => {
					console.log('Error in calling markMemberAsTrusted CF:' + err.message);
				});
		} catch (error) {
			console.log('Error in calling markMemberAsTrusted CF:' + error.message);
		}
	}

	markAsNonTrusted(member): void {
		const callable = this.fns.httpsCallable(`markMemberAsNonTrusted`);
		try {
			let apiResponse = callable({
				meetupId: this.selectedMeetupDocData.id,
				memberUid: member.userId
			})
				.pipe(first())
				.subscribe(resp => {
					console.log({resp});
					this.toastrService.success('Member is marked as NON-TRUSTED and removed from review list.', null, {closeButton: true});
				}, err => {
					console.log('Error in calling markMemberAsNonTrusted CF:' + err.message);
				});
		} catch (error) {
			console.log('Error in calling markMemberAsNonTrusted CF:' + error.message);
		}
	}

	ngOnDestroy = (): void => {
		this.loggedInUserFromAuthServiceSubscription.unsubscribe();
		this.meetupInContextServiceSubscription.unsubscribe();
	}

}
