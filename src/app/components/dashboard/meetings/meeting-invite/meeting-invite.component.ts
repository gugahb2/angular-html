import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../../../shared/services/auth.service';
import {ApiService} from '../../../../shared/services/api.service';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
import {ActivatedRoute, Router} from '@angular/router';
import * as moment from 'moment';
import {ToastrService} from 'ngx-toastr';
import {FormArray, FormControl, FormGroup} from '@angular/forms';

@Component({
    selector: 'app-meeting-invite',
    templateUrl: './meeting-invite.component.html',
    styleUrls: ['./meeting-invite.component.scss']
})
export class MeetingInviteComponent implements OnInit {
    meetingId: string;
    meetingCollection: any;
    peopleForm: FormGroup;

    constructor(
        private route: ActivatedRoute,
        public authService: AuthService,
        public apiService: ApiService,
        private auth: AngularFireAuth,
        public afs: AngularFirestore,
        private router: Router,
        private toast: ToastrService
    ) {
        this.route.paramMap.subscribe(params => {
            this.meetingId = params.get('id');
        });
        this.GetMeeting();
    }

    ngOnInit(): void {
        this.peopleForm = new FormGroup({
            people: new FormArray([
                new FormGroup({
                    name: new FormControl(''),
                    email: new FormControl(''),
                    phone: new FormControl(''),
                })
            ])
        });
    }

    get f() {
        return this.peopleForm.controls;
    }

    get People() {
        return this.f.people as FormArray;
    }

    AddPeople(e) {
        e.preventDefault();
        this.People.push(
            new FormGroup({
                name: new FormControl(''),
                email: new FormControl(''),
                phone: new FormControl(''),
            })
        );
    }

    /**
     * Get the meeting collection from firebase
     */
    GetMeeting() {
        this.auth.idToken.subscribe(data => {
            const meeting = this.afs.collection('Meetings').doc(this.meetingId);
            meeting.snapshotChanges().subscribe((snapshot) => {
                this.meetingCollection = snapshot.payload.data();
            });
        });
    }

    /**
     * Copy the link to clipboard
     */
    CopyMeetingLink(e) {
        e.preventDefault();
        const link = document.location.origin + this.meetingCollection.joinURL;
        navigator.clipboard.writeText(link)
            .then(() => {
                    this.toast.success('Invitation link copied');
                },
                (err) => {
                    this.toast.error('Could not copy link');
                }
            );
    }

    SendInvitation() {
        console.log(this.peopleForm.value);
        // this.router.navigate([`/dashboard/meetings`]);
    }

    SendLater() {
        this.router.navigate([`/dashboard/meetings`]);
    }

    /**
     * Return the meeting time in format
     */
    get MeetingTime() {
        if (this.meetingCollection.dateValues && this.meetingCollection.dateValues.start && this.meetingCollection.dateValues.end) {
            const start = moment.unix(this.meetingCollection.dateValues.start);
            const end = moment.unix(this.meetingCollection.dateValues.end);
            return `${start.format('HH:mm')} - ${end.format('HH:mm A')}`;
        }
    }
}
