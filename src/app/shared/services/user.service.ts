import {Injectable} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    public user: any;
    public userCollection: any;
    public displayName: string;
    public loginType: string;
    public meeting: any;

    constructor(
        private auth: AngularFireAuth,
        private afs: AngularFirestore
    ) {
        this.user = JSON.parse(localStorage.getItem('user'));
        this.displayName = localStorage.getItem('displayName');
        this.loginType = localStorage.getItem('loginType');
        // this.ListenBrowserClose();
    }

    async ListenBrowserClose() {
        // window.onbeforeunload = (e) => {
        //     localStorage.setItem('closed', 'true');
        //     if (performance.navigation.type === performance.navigation.TYPE_RELOAD) {
        //         console.log('reloaded');
        //         localStorage.setItem('closed', 'false');
        //     }
        // };

        // check if another tab is opened for the same application
        // localStorage.openpages = Date.now();
        // window.addEventListener('storage', (e) => {
        //     if (e.key === 'openpages') {
        //         // Listen if anybody else is opening the same page!
        //         localStorage.page_available = Date.now();
        //     }
        //     if (e.key === 'page_available') {
        //         alert('One more page already open');
        //     }
        // }, false);
        // const firstTime = localStorage.getItem('first_time');
        // if (!firstTime) {
        //     // first time loaded!
        //     localStorage.setItem('first_time', 'true');
        //     localStorage.setItem('reload', 'false');
        // }

        // if (performance.navigation.type === performance.navigation.TYPE_RELOAD) {
        //     localStorage.setItem('reload', 'true');
        // }
    }

    FetchUserCollection() {
        this.auth.idToken.subscribe(data => {
            const user = this.afs.collection('Users').doc(this.user.uid);
            user.snapshotChanges().subscribe((snapshot) => {
                this.userCollection = snapshot.payload.data();
                console.log('FetchUserCollection - data changed', this.userCollection);
            });
        });
    }

    get_AllMeetings()
    {
      return this.afs.collection('Meetings').snapshotChanges();          
    }    
}
