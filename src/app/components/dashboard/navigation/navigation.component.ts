import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../../shared/services/auth.service';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';

@Component({
    selector: 'app-navigation',
    templateUrl: './navigation.component.html',
    styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {
    user: any;
    userCollection: any;

    constructor(
        public authService: AuthService,
        private auth: AngularFireAuth,
        public afs: AngularFirestore,
    ) {
        // this.user = JSON.parse(localStorage.getItem('user'));
        // this.GetUserCollection();
    }

    ngOnInit(): void {
    }

    GetUserCollection() {
        this.auth.idToken.subscribe(data => {
            const user = this.afs.collection('Users').doc(this.user.uid);
            user.snapshotChanges().subscribe((snapshot) => {
                this.userCollection = snapshot.payload.data();
            });
        });
    }
}
