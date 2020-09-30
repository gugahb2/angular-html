import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../../../shared/services/auth.service';
import {ApiService} from '../../../../shared/services/api.service';
import {ActivatedRoute, Router} from '@angular/router';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
import {FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
    selector: 'app-meeting-notify',
    templateUrl: './meeting-notify.component.html',
    styleUrls: ['./meeting-notify.component.scss']
})
export class MeetingNotifyComponent implements OnInit {
    meetingId: string;
    meetingCollection: any;
    notifyForm: FormGroup;

    constructor(
        public authService: AuthService,
        public apiService: ApiService,
        private route: ActivatedRoute,
        private auth: AngularFireAuth,
        public afs: AngularFirestore,
        private router: Router
    ) {
        this.route.paramMap.subscribe(params => {
            this.meetingId = params.get('id');
        });
        this.GetMeeting();
    }

    ngOnInit(): void {
        this.notifyForm = new FormGroup({
            sendNotification: new FormControl(false, Validators.required),
            message: new FormControl('', Validators.required)
        });
    }

    GetMeeting() {
        this.auth.idToken.subscribe(data => {
            const meeting = this.afs.collection('Meetings').doc(this.meetingId);
            meeting.snapshotChanges().subscribe((snapshot) => {
                this.meetingCollection = snapshot.payload.data();
            });
        });
    }

    SubmitForm(e) {
        e.preventDefault();
        console.log(this.notifyForm.value);
        setTimeout(() => {
            this.router.navigate([`/dashboard/meeting/${this.meetingId}/invite`]);
        }, 100);
    }

    SendLater() {
        setTimeout(() => {
            this.router.navigate([`/dashboard/meeting/${this.meetingId}/invite`]);
        }, 100);
    }
}
