import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {AuthService} from '../../../../shared/services/auth.service';
import {ApiService} from '../../../../shared/services/api.service';
import {ActivatedRoute, Router} from '@angular/router';
import {FormArray, FormControl, FormGroup, Validators, FormBuilder} from '@angular/forms';
import {Subscription} from "rxjs";
import {MeetupInContextService} from "../../../../shared/services/meetup-in-context.service";
import {AngularFirestore} from "@angular/fire/firestore";
import {AngularFireAuth} from "@angular/fire/auth";
import {firestore} from "firebase";

@Component({
	selector: 'app-add-new-meetup',
	templateUrl: './add-new-meetup.component.html',
	styleUrls: ['./add-new-meetup.component.scss']
})
export class AddNewMeetup implements OnInit {
	private loggedInUserFromAuthServiceSubscription: Subscription;
	private loggedInUserDocData: any;
	private meetupList: any;
	private meetupSubscriptionSnapshot: any;
	private meetupRole: any;
	private selectedMeetupDocData: any;
    private meetupId: string;

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
		private ref: ChangeDetectorRef
	) {

		this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(firebaseUser => {
			this.loggedInUserDocData = firebaseUser;
			if (firebaseUser &&
				firebaseUser.meetupSubscriptionSnapshots &&
				firebaseUser.meetupSubscriptionSnapshots.length > 0) {
				this.meetupList = firebaseUser.meetupSubscriptionSnapshots;
				if(this.meetupId) {
                    this.meetupSubscriptionSnapshot = firebaseUser.meetupSubscriptionSnapshots.find((m) => m.meetupId === this.meetupId);
                } else if(this.loggedInUserDocData.meetupSubscriptionSnapshots && this.loggedInUserDocData.meetupSubscriptionSnapshots.length > 0){
                    this.meetupSubscriptionSnapshot = firebaseUser.meetupSubscriptionSnapshots[0];
                    this.meetupId = this.meetupSubscriptionSnapshot.meetupId;
                }
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
					});
				} else {
					this.selectedMeetupDocData = this.meetupInContextService.meetupInContext;
					console.log('meetup document from meetup-in-context-service', this.selectedMeetupDocData);
				}
			}
		});

	}

	status = false; // handling slider
	questionForm: FormGroup; // handling dynamic part
	meetupForm = new FormGroup({ // meetup form
		name: new FormControl('', [Validators.required, Validators.maxLength(60)]),
		description: new FormControl('', [Validators.required, Validators.maxLength(500)]),
		isPublic: new FormControl('false', [Validators.required]),
		hasJoiningQuestions: new FormControl(false)
	});
	questionCount: number; // handle the question count, max question = 5


	ngOnInit(): void {
		// init form builder
		this.questionForm = this.fb.group({
			questions: new FormArray([
				/*this.fb.group({
				})*/
			])
		});
		this.questionCount = 0; // set initial count to 0
	}

	get questionFormControls() {
		return this.questionForm.controls;
	}

	get questionsFormsArray() {
		return this.questionFormControls.questions as FormArray;
	}

	openQuestionPanel($event) {
		$event.preventDefault();
		console.log('opening question panel');
		if(this.questionsFormsArray.length === 0) {
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
	}

	doneAddingQuestions($event) {
		$event.preventDefault();
		if(this.questionForm.valid) {
			this.status = false;
		}
	}

	clearQuestionsNClosePopup($event) {
		$event.preventDefault();
		this.questionsFormsArray.clear();
		this.status = false;
		this.meetupForm.get('hasJoiningQuestions').setValue(false);
	}


	createMeetup() {
		if (this.meetupForm.invalid) {
			return;
		}
		const questions = this.questionForm.value.questions;
		let newMeetupDataToCreate = this.meetupForm.value;
		if(newMeetupDataToCreate.isPublic === 'true'){
			newMeetupDataToCreate.isPublic = true;
		} else if(newMeetupDataToCreate.isPublic === 'false'){
			newMeetupDataToCreate.isPublic = false;
		}
		newMeetupDataToCreate.joiningQuestions = [];
		if(newMeetupDataToCreate.hasJoiningQuestions) {
			questions.map(q => {
				if (q.question && q.question.trim()) {
					newMeetupDataToCreate.joiningQuestions.push({question: q.question});
				}
			});
		}
		newMeetupDataToCreate.owner = {
			uid: this.loggedInUserDocData.uid,
			name: this.loggedInUserDocData.displayName,
			email: this.loggedInUserDocData.email
		}
		newMeetupDataToCreate.createdAt = firestore.FieldValue.serverTimestamp();
		let meetupCollection = this.afs.collection('OnlineMeetups');
		meetupCollection.add(newMeetupDataToCreate).then((snapshot) => {
			let meetupId = snapshot.id;
            this.router.navigate([`/dashboard/meetup/${meetupId}`]);
		});

	}

	redirectBack() {
		this.location.back();
	}

	toggleJoiningQuestionStatus(e) {
		if (!this.meetupForm.get('hasJoiningQuestions').value) {
			this.status = false;
			this.questionsFormsArray.clear();
		} else {
		}

	}
}
