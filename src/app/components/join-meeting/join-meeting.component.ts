import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AngularFireAuth} from '@angular/fire/auth';
import {HttpClient} from '@angular/common/http';
import {AngularFirestore} from '@angular/fire/firestore';

@Component({
    selector: 'app-join-meeting',
    templateUrl: './join-meeting.component.html',
    styleUrls: ['./join-meeting.component.scss']
})
export class JoinMeetingComponent implements OnInit {
    uuid: string;
    hasLoginSession: boolean;

    constructor(
        private route: ActivatedRoute,
        private auth: AngularFireAuth,
        private http: HttpClient,
        private router: Router,
        private afs: AngularFirestore
    ) {
        this.route.paramMap.subscribe(params => {
            this.uuid = params.get('id');
        });
        this.hasLoginSession = true;
        auth.idToken.subscribe(token => {
            if (!token) {
                this.hasLoginSession = false;
            }
        });
    }

    ngOnInit(): void {
        this.FetchMeeting();
    }

    FetchMeeting() {
        console.log('join meeting component');
        const apiUri = `https://us-central1-online-meetups-e955d.cloudfunctions.net/api/meetinguuids/${this.uuid}`;
        this.auth.idToken.subscribe(token => {
            if (token) {
                this.hasLoginSession = true;
                const headers = {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + token
                };
                this.auth.authState.subscribe(user => {
                    if (user) {
                        if (!user.isAnonymous) {
                            this.http.get<any>(apiUri, {headers}).subscribe(data => {
                                if (data && data.uuid) {
                                    setTimeout(() => {
                                        this.router.navigate([`/dashboard/meetings`]);
                                    }, 100);
                                }
                            });
                        } else {
                            const userCollection = this.afs.collection('Users').doc(user.uid);
                            userCollection.snapshotChanges().subscribe((snapshot) => {
                                const response = snapshot.payload.data();
                                if (typeof response === 'undefined' && this.uuid) {
                                    this.router.navigate([`/guest/${this.uuid}/form`]);
                                } else {
                                    setTimeout(() => {
                                        this.router.navigate([`/dashboard/meetings`]);
                                    }, 100);
                                }
                            });
                        }
                    }
                });
            } else {
                setTimeout(() => {
                    this.router.navigate([`/sign-in`, {id: this.uuid}]);
                }, 100);
            }
        });
    }
}
