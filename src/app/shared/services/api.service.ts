import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {Router} from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    user: any;
    userCollection: any;

    constructor(
        private http: HttpClient,
        public afs: AngularFirestore,
        private auth: AngularFireAuth,
        private router: Router
    ) {
        this.SetUser();
    }

    SetUser() {
        this.user = JSON.parse(localStorage.getItem('user'));
    }

    /**
     * Fetch user collection from firebase database
     */
    FetchUserCollection() {
        return new Promise(resolve => {
            if (this.user && this.user.uid) {
                this.auth.idToken.subscribe(data => {
                    const user = this.afs.collection('Users').doc(this.user.uid).get();
                    user.subscribe((snapshot) => {
                        this.userCollection = snapshot.data();
                        resolve(snapshot.data());
                        localStorage.setItem('userCollection', JSON.stringify(this.userCollection));
                    });
                });
            }
        });
    }

    UserOnUpdate() {
        this.auth.idToken.subscribe(data => {
            const user = this.afs.collection('Users').doc(this.user.uid);
            user.snapshotChanges().subscribe((snapshot) => {
                this.userCollection = snapshot.payload.data();
                localStorage.setItem('userCollection', JSON.stringify(this.userCollection));
            });
        });
    }

    setPresence(status) {

    }

    /**
     * Return the user collection
     */
    get UserCollection(): object {
        return this.userCollection || JSON.parse(localStorage.getItem('userCollection'));
    }

    /**
     * Create meetup on submitting meetup form
     */
    CreateMeetup(data) {
        data = {
            ...data,
            owner: {
                uid: this.user.uid,
                name: this.user.displayName,
                email: this.user.email
            },
            createdAt: Date.now()
        };

        this.auth.idToken.subscribe(sub => {
            const meetupCollection = this.afs.collection('OnlineMeetups');
            meetupCollection.add(data).then(response => {
                setTimeout(() => {
                    this.router.navigate([`/dashboard/meetup/${response.id}`]);
                }, 100);
            });
        });
    }

    /**
     * Create meeting on submitting meeting form
     */
    CreateMeeting(data) {
        this.auth.idToken.subscribe(sub => {
            const meetingCollection = this.afs.collection('Meetings');
            meetingCollection.add(data).then(response => {
                setTimeout(() => {
                    this.router.navigate([`/dashboard/meeting/${response.id}/notify`]);
                }, 100);
            });
        });
    }
}
