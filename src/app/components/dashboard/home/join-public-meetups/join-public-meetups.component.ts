import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
import {UserService} from '../../../../shared/services/user.service';
import {FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
    selector: 'app-join-public-meetups',
    templateUrl: './join-public-meetups.component.html',
    styleUrls: ['./join-public-meetups.component.scss']
})
export class JoinPublicMeetupsComponent implements OnInit {

    meetupId: string;
    userCollection: any;
    meetupCollection: any;
    showJoiningPopup: boolean;
    questionForm: FormGroup;

    constructor(
        private route: ActivatedRoute,
        private auth: AngularFireAuth,
        private afs: AngularFirestore,
        private userService: UserService
    ) {
        this.showJoiningPopup = false;
        route.params.subscribe(params => {
            if (params.id) {
                this.meetupId = params.id;
                this.FetchMeetup();
            }
        });
        this.FetchUser();
    }

    ngOnInit(): void {
    }

    FetchMeetup() {
        this.auth.idToken.subscribe((data) => {
            const meetupCollection = this.afs.collection('OnlineMeetups').doc(this.meetupId);
            meetupCollection.snapshotChanges().subscribe((snapshot) => {
                this.meetupCollection = snapshot.payload.data();
                console.log('meetup collection', this.meetupCollection);
                this.HandleMeetupQuestions();
            });
        });
    }

    FetchUser() {
        this.auth.idToken.subscribe((data) => {
            const user = this.afs.collection('Users').doc(this.userService.user.uid);
            user.snapshotChanges().subscribe((snapshot) => {
                this.userCollection = snapshot.payload.data();
                console.log('user collection', this.userCollection);
            });
        });
    }

    HandleMeetupQuestions() {
        if (!this.IsMember) {
            const group = {};
            if (this.JoiningQuestions.length > 0) {
                this.JoiningQuestions.forEach((question, key) => {
                    group[`question-${key}`] = new FormControl(
                        key === 0 && this.userCollection && this.userCollection.displayName ? this.userCollection.displayName : '',
                        Validators.required
                    );
                });
                this.questionForm = new FormGroup(group);
                this.showJoiningPopup = true;
            }
        }
    }

    get JoiningQuestions(): any {
        return this.meetupCollection.joiningQuestions || [];
    }

    /**
     * Check if the user is already a member of the meetup
     */
    get IsMember(): boolean {
        return this.userCollection &&
            this.userCollection.meetupSubscriptionSnapshots &&
            this.userCollection.meetupSubscriptionSnapshots.length > 0 &&
            this.userCollection.meetupSubscriptionSnapshots.find(meetup => meetup.meetupId === this.meetupId);
    }

    SubmitQuestionForm(e) {
        e.preventDefault();
        if (this.questionForm.invalid) {
            return false;
        }
        const formData = [];
        const formValues = this.questionForm.value;
        this.JoiningQuestions.forEach((question, key) => {
            formData.push({...question, ...{answer: formValues[`question-${key}`]}});
        });
        this.showJoiningPopup = false;
        console.log(formData);
    }
}
