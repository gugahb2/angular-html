import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of} from "rxjs";
import {AngularFireAuth} from "@angular/fire/auth";
import {AngularFirestore} from "@angular/fire/firestore";
import {Router} from "@angular/router";
import {switchMap} from "rxjs/operators";

@Injectable({
	providedIn: 'root'
})
export class MeetupInContextService {

	meetupInContextSubject = new BehaviorSubject(null);
	meetupInContext: any;

	constructor(private router: Router) {
		this.meetupInContextSubject.subscribe({
			next: (meetupInContextObject) => {
				this.meetupInContext = meetupInContextObject;
				//console.log('Meetup change event captured in meetup-in-context-service with meetupDocData:' + JSON.stringify(meetupInContextObject))
			}
		});
	}

}
