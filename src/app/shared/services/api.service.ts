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
    loggedInUserDocData: any;

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
     * Fetch user document from firebase database
     */
    fetchUserDocument() {
        return new Promise(resolve => {
            if (this.user && this.user.uid) {
                this.auth.idToken.subscribe(data => {
                    const user = this.afs.collection('Users').doc(this.user.uid).get();
                    user.subscribe((snapshot) => {
                        this.loggedInUserDocData = snapshot.data();
                        resolve(snapshot.data());
                        localStorage.setItem('userCollection', JSON.stringify(this.loggedInUserDocData));
                    });
                });
            }
        });
    }

    UserOnUpdate() {
        this.auth.idToken.subscribe(data => {
            const user = this.afs.collection('Users').doc(this.user.uid);
            user.snapshotChanges().subscribe((snapshot) => {
                this.loggedInUserDocData = snapshot.payload.data();
                localStorage.setItem('userCollection', JSON.stringify(this.loggedInUserDocData));
            });
        });
    }

    setPresence(status) {

    }

    /**
     * Return the user collection
     */
    get UserCollection(): object {
        return this.loggedInUserDocData || JSON.parse(localStorage.getItem('userCollection'));
    }


}
