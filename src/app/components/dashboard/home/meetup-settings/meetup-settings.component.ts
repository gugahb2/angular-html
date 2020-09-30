import {Component, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {AuthService} from '../../../../shared/services/auth.service';
import {ApiService} from '../../../../shared/services/api.service';
import {Router} from '@angular/router';
import {FormArray, FormControl, FormGroup, Validators, FormBuilder} from '@angular/forms';

@Component({
    selector: 'app-meetup-settings',
    templateUrl: './meetup-settings.component.html',
    styleUrls: ['./meetup-settings.component.scss']
})
export class MeetupSettingsComponent implements OnInit {
    constructor(
        public authService: AuthService,
        public apiService: ApiService,
        public router: Router,
        private fb: FormBuilder,
        private location: Location,
    ) {

    }

    status = false; // handling slider
    questionForm: FormGroup; // handling dynamic part
    meetupForm = new FormGroup({ // meetup form
        name: new FormControl('', [Validators.required]),
        description: new FormControl('', [Validators.required]),
        isPublic: new FormControl('false', [Validators.required]),
        hasJoiningQuestions: new FormControl(false)
    });
    questionCount: number; // handle the question count, max question = 5


    ngOnInit(): void {
        // init form builder
        this.questionForm = this.fb.group({
            questions: new FormArray([
                this.fb.group({
                    question: [`What's your name ?`, Validators.required]
                })
            ])
        });
        this.questionCount = 1; // set initial count to 1
    }

    /**
     * get question form controls
     */
    get f() {
        return this.questionForm.controls;
    }

    /**
     * Get form array
     */
    get Questions() {
        return this.f.questions as FormArray;
    }

    /**
     * open slider
     */
    QuestionPanel($event) {
        $event.preventDefault();
        this.status = true;
    }

    /**
     * Add more fields
     */
    AddQuestion(e) {
        e.preventDefault();
        // check if the current field has value
        // then add another field
        if (this.questionForm.valid && this.questionCount < 5) {
            this.Questions.push(this.fb.group({
                question: ['', Validators.required]
            }));
            this.questionCount++;
        }
    }

    /**
     * Submit questions
     */
    SetQuestion(event) {
        event.preventDefault();
        this.status = false;
    }

    /**
     * Request meetup creation
     */
    CreateMeetupRequest() {
        if (this.meetupForm.invalid) {
            return;
        }
        const questions = this.questionForm.value.questions;
        const meetupFields = this.meetupForm.value;
        meetupFields.joiningQuestions = [];
        questions.map(q => {
            if (q.question && q.question.trim()) {
                meetupFields.joiningQuestions.push({question: q.question});
            }
        });
        this.apiService.CreateMeetup(meetupFields);
    }

    RedirectBack() {
        this.location.back();
    }

    ToggleJoiningQuestionStatus(e) {
        if (!this.meetupForm.get('hasJoiningQuestions').value) {
            this.status = false;
        }
    }
}
