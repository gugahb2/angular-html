import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {UserService} from '../../../../shared/services/user.service';

@Component({
    selector: 'app-join-meetup',
    templateUrl: './join-meetup.component.html',
    styleUrls: ['./join-meetup.component.scss']
})
export class JoinMeetupComponent implements OnInit {
    meetupId;
    meetup: any;
    questionForm: FormGroup;
    userCollection: any;
    loader: boolean;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private auth: AngularFireAuth,
        private afs: AngularFirestore,
        private userService: UserService
    ) {
        this.route.paramMap.subscribe((params) => {
            this.meetupId = params.get('id');
        });
    }

    ngOnInit(): void {
        this.FetchMeetup();
        this.FetchUser();
    }

    /**
     * Fetch user collection
     */
    FetchUser() {
        this.auth.idToken.subscribe((data) => {
            const user = this.afs.collection('Users').doc(this.userService.user.uid);
            user.snapshotChanges().subscribe((snapshot) => {
                this.userCollection = snapshot.payload.data();
                this.RedirectToMeetupIfMember();
            });
        });
    }

    /**
     * Check if the user is a member already
     * Redirect to the meetup if true
     */
    RedirectToMeetupIfMember() {
        if (this.IsMember) {
            this.router.navigate([`/dashboard/meetup/${this.meetupId}`]);
        }
    }

    /**
     * Fetch meetup data
     */
    FetchMeetup() {
        this.loader = true;
        this.auth.idToken.subscribe(data => {
            const meetupCollection = this.afs.collection('OnlineMeetups').doc(this.meetupId);
            meetupCollection.snapshotChanges().subscribe((snapshot) => {
                this.meetup = snapshot.payload.data();
                this.loader = true;
                this.GenerateQuestionForm();
            });
        });
    }

    /**
     * Generate joining question form
     */
    GenerateQuestionForm() {
        const group = {
            name: new FormControl(this.userCollection.displayName, Validators.required)
        };
        if (this.IsPublic && this.meetup.joiningQuestions && this.meetup.joiningQuestions.length > 0) {
            this.meetup.joiningQuestions.forEach((question, key) => {
                group[`question-${key}`] = new FormControl('', Validators.required);
            });
            this.questionForm = new FormGroup(group);
        }
    }

    /**
     * Return the joining questions list
     */
    get JoiningQuestions(): any {
        return this.meetup.joiningQuestions || [];
    }

    /**
     * Return true if the meetup is public
     */
    get IsPublic(): boolean {
        return this.meetup && this.meetup.isPublic === 'true' || false;
    }

    /**
     * Submit the meetup joining question form
     */
    SubmitForm(e) {
        e.preventDefault();
        if (this.questionForm.invalid) {
            return false;
        }
        const formData = [];
        const formValues = this.questionForm.value;
        this.JoiningQuestions.forEach((question, key) => {
            formData.push({...question, ...{answer: formValues[`question-${key}`]}});
        });
        formData.push({name: formValues.name});
        console.log(formData, formValues);
    }

    /**
     * Check if the current user is part of the current meetup
     */
    get IsMember(): boolean {
        return this.userCollection &&
            this.userCollection.meetupSubscriptionSnapshots &&
            this.userCollection.meetupSubscriptionSnapshots.length > 0 &&
            this.userCollection.meetupSubscriptionSnapshots.find(meetup => meetup.meetupId === this.meetupId);
    }
}
