import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {AngularFirestore} from '@angular/fire/firestore';
import {AuthService} from '../../shared/services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class DataService {

    private meetingsSource = new BehaviorSubject(null);
    meetings$ = this.meetingsSource.asObservable();

    constructor(
        private afs: AngularFirestore,
        private authService: AuthService
    ) {

    }

    setUserMeetings(userMeetings) {
        this.meetingsSource.next(userMeetings);
    }


}
