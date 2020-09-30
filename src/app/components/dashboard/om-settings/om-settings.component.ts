import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import {AuthService} from "../../../shared/services/auth.service";
import {ApiService} from "../../../shared/services/api.service";
import {ActivatedRoute, Router} from "@angular/router";
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {Location} from "@angular/common";
import {MeetupInContextService} from "../../../shared/services/meetup-in-context.service";
import {AngularFirestore} from "@angular/fire/firestore";
import {AngularFireAuth} from "@angular/fire/auth";
import {firestore} from "firebase";
import {first} from "rxjs/operators";
import {AngularFireFunctions} from "@angular/fire/functions";
import {ToastrService} from "ngx-toastr";

@Component({
	selector: 'app-om-settings',
	templateUrl: './om-settings.component.html',
	styleUrls: ['./om-settings.component.scss']
})
export class OmSettingsComponent implements OnInit {
	private loggedInUserFromAuthServiceSubscription: Subscription;
	private loggedInUserDocData: any;
	private meetupList: any;
	private meetupSubscriptionSnapshot: any;
	private meetupRole: any;
	selectedMeetupDocData: any;
	private meetupId: string;
	meetupForm: FormGroup;
	showNoPermissionBox: boolean = false;
	formArrayQuestionsIdsToDelete : Set<string> = new Set();

	constructor(
		public authService: AuthService,
		public apiService: ApiService,
		public router: Router,
		private fb: FormBuilder,
		private location: Location,
		private meetupInContextService: MeetupInContextService,
		public route: ActivatedRoute,
		private api: ApiService,
		public afs: AngularFirestore,
		private auth: AngularFireAuth,
		private ref: ChangeDetectorRef,
		private angularFireFunctions: AngularFireFunctions,
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
				} else if (this.loggedInUserDocData.meetupSubscriptionSnapshots && this.loggedInUserDocData.meetupSubscriptionSnapshots.length > 0) {
					if (firebaseUser.lastMeetupInContextId) {
						if (firebaseUser.meetupSubscriptionSnapshots.some(meetup => meetup.meetupId === firebaseUser.lastMeetupInContextId)) {
							this.meetupSubscriptionSnapshot = firebaseUser.meetupSubscriptionSnapshots.find(meetupSnapshot => meetupSnapshot.meetupId === firebaseUser.lastMeetupInContextId)
						}
					} else {
						this.meetupSubscriptionSnapshot = firebaseUser.meetupSubscriptionSnapshots[0];
					}
					this.meetupId = this.meetupSubscriptionSnapshot.meetupId;
				}
				if (this.meetupSubscriptionSnapshot && this.meetupSubscriptionSnapshot.role && this.meetupSubscriptionSnapshot.role.length > 0) {
					this.meetupRole = this.meetupSubscriptionSnapshot.role[0];
					if (this.meetupRole && !['MEETUP_OWNER', 'MEETUP_ADMIN'].includes(this.meetupRole)) {
						router.navigate(['/dashboard']);
					}
				}

				let meetupDocumentSnapshot;
				if (!this.meetupInContextService.meetupInContext) {
					meetupDocumentSnapshot = this.afs.collection('OnlineMeetups').doc(this.meetupId);
					meetupDocumentSnapshot.snapshotChanges().subscribe((snapshot) => {
						this.selectedMeetupDocData = snapshot.payload.data();
						this.meetupInContextService.meetupInContextSubject.next(this.selectedMeetupDocData);
						//console.log('meetup document based on id from url:', this.selectedMeetupDocData);
						this.meetupForm = new FormGroup({ // meetup form
							name: new FormControl(this.selectedMeetupDocData.name, [Validators.required, Validators.maxLength(60)]),
							description: new FormControl(this.selectedMeetupDocData.description, [Validators.required, Validators.maxLength(500)]),
							isPublic: new FormControl(`${this.selectedMeetupDocData.isPublic}`, [Validators.required]),
							hasJoiningQuestions: new FormControl(this.selectedMeetupDocData.hasJoiningQuestions)
						});
						this.questionCount = this.selectedMeetupDocData.joiningQuestions ? this.selectedMeetupDocData.joiningQuestions.length : 0; // set initial count to 0
						if (this.selectedMeetupDocData.joiningQuestions?.length > 0) {
							for(let j=0; j< this.selectedMeetupDocData.joiningQuestions.length; j++) {
								let joiningQuestion = this.selectedMeetupDocData.joiningQuestions[j];
								if(this.questionsFormsArray && !this.questionsFormsArray.value.find(question =>
								{
									if(question?.id) {
										return question.id === this.selectedMeetupDocData.joiningQuestions[j].id;
									}
								})) {
									this.questionsFormsArray.push(this.fb.group({
										question: [`${joiningQuestion.question}`, Validators.required],
										id: [`${joiningQuestion.id}`]
									}));
								}
							}
						}
					});
				} else {
					this.selectedMeetupDocData = this.meetupInContextService.meetupInContext;
					//console.log('meetup document from meetup-in-context-service', this.selectedMeetupDocData);
					if (!this.meetupForm) {
						this.meetupForm = new FormGroup({ // meetup form
							name: new FormControl(this.selectedMeetupDocData.name, [Validators.required, Validators.maxLength(60)]),
							description: new FormControl(this.selectedMeetupDocData.description, [Validators.required, Validators.maxLength(500)]),
							isPublic: new FormControl(`${this.selectedMeetupDocData.isPublic}`, [Validators.required]),
							hasJoiningQuestions: new FormControl(this.selectedMeetupDocData.hasJoiningQuestions)
						});
						this.questionCount = this.selectedMeetupDocData.joiningQuestions ? this.selectedMeetupDocData.joiningQuestions.length : 0; // set initial count to 0
						if (this.selectedMeetupDocData.joiningQuestions?.length > 0) {
							for(let j=0; j< this.selectedMeetupDocData.joiningQuestions.length; j++) {
								let joiningQuestion = this.selectedMeetupDocData.joiningQuestions[j];
								if(this.questionsFormsArray && !this.questionsFormsArray.value.find(question =>
								{
									if(question?.id) {
										return question.id === this.selectedMeetupDocData.joiningQuestions[j].id;
									}
								})) {
									this.questionsFormsArray.push(this.fb.group({
										question: [`${joiningQuestion.question}`, Validators.required],
										id: [`${joiningQuestion.id}`]
									}));
								}
							}
						}
					}
				}
			}
		});

	}

	status = false; // handling slider
	questionForm: FormGroup; // handling dynamic part

	questionCount: number; // handle the question count, max question = 5


	ngOnInit(): void {
		// init form builder
		this.questionForm = this.fb.group({
			questions: new FormArray([

			])
		});

	}

	get questionFormControls() {
		return this.questionForm.controls;
	}

	get questionsFormsArray() {
		return this.questionFormControls.questions as FormArray;
	}

	openQuestionPanel($event) {
		$event.preventDefault();
		//console.log('opening question panel');
		console.log('Length of array now:' + this.questionsFormsArray.length);
		if(this.selectedMeetupDocData.joiningQuestions?.length < 5){
			this.questionsFormsArray.push(this.fb.group({
				question: ['', Validators.required]
			}));
		}
		this.status = true;
		this.ref.detectChanges();
	}

	addQuestionRow(e) {
		e.preventDefault();
		// check if the current field has value then add another field
		if (this.questionForm.valid && this.questionCount < 5) {
			this.questionsFormsArray.push(this.fb.group({
				question: ['', Validators.required]
			}));
			this.questionCount++;
		}
		this.ref.detectChanges();
	}


	deleteThisQuestion(e, q, index){
		e.preventDefault();
		if(q?.value?.id) {
			this.formArrayQuestionsIdsToDelete.add(q?.value?.id)
		}
		this.questionsFormsArray.removeAt(index);
		console.log('Remaining values in questions array:' + JSON.stringify(this.questionsFormsArray.value, undefined, 4));

	}

	doneAddingQuestions($event) {
		$event.preventDefault();
		if (this.questionForm.valid) {
			this.status = false;
		}
	}

	clearQuestionsNClosePopup($event) {
		$event.preventDefault();
		//this.questionsFormsArray.clear();
		this.status = false;
		this.meetupForm.get('hasJoiningQuestions').setValue(false);
	}


	saveChangesToMeetup() {
		if (this.meetupForm.invalid) {
			return;
		}
		const questions = this.questionForm.value.questions;
		let updatedMeetupData = this.meetupForm.value;
		updatedMeetupData.meetupId = this.selectedMeetupDocData.id;
		if (updatedMeetupData.isPublic === 'true') {
			updatedMeetupData.isPublic = true;
		} else if (updatedMeetupData.isPublic === 'false') {
			updatedMeetupData.isPublic = false;
		}
		updatedMeetupData.joiningQuestionsToAdd = [];
		if (updatedMeetupData.hasJoiningQuestions) {
			questions.map(q => {
				if (q.question && q.question.trim() && !q.id) {
					updatedMeetupData.joiningQuestionsToAdd.push({question: q.question});
				}
			});
		}

		updatedMeetupData.joiningQuestionIdsToDelete = this.formArrayQuestionsIdsToDelete ? Array.from(this.formArrayQuestionsIdsToDelete) : [];
		this.formArrayQuestionsIdsToDelete.clear();

		const callable = this.angularFireFunctions.httpsCallable(`updateMeetup`);
		this.questionsFormsArray.clear();
		try {
			let apiResponse = callable(updatedMeetupData)
				.pipe(first())
				.subscribe(resp => {
					console.log({resp});
					this.toastrService.success('Meetup has been updated', null, {closeButton: true});
					}, err => {
					console.log('Error in calling updateMeetup CF:' + err.message);
				});
			//console.log('apiResponse:' + apiResponse);
		} catch (error) {
			console.log('Error in calling updateMeetup CF:' + error.message);
		}
	}

	copyMeetupJoinLinkToClipboard(e) {
		e.preventDefault();
		const link = document.location.origin + `/dashboard/meetups/${this.selectedMeetupDocData.id}/join?frompm=y&mid=${this.selectedMeetupDocData.id}`;
		navigator.clipboard.writeText(link)
			.then(() => {
					this.toastrService.success('Meetup link copied', null, {closeButton: true});
				},
				(err) => {
					this.toastrService.error('Could not copy link');
				}
			);
	}

	toggleJoiningQuestionStatus(e) {
		if (!this.meetupForm.get('hasJoiningQuestions').value) {
			this.status = false;
			this.questionsFormsArray.clear();
		} else {
		}

	}
}
