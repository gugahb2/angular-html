import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AngularFirestore} from '@angular/fire/firestore';
import {Observable, Subscription} from 'rxjs';
import {AuthService} from '../../shared/services/auth.service';
import {Router} from "@angular/router";
import {PresenceService} from "../../shared/services/presence.service";

@Component({
	selector: 'app-public-meetups',
	templateUrl: './public-meetups.component.html',
	styleUrls: ['./public-meetups.component.scss']
})
export class PublicMeetupsComponent implements OnInit {
	public loggedInUserDocData: any;

	constructor(public afs: AngularFirestore,
	            public authService: AuthService,
	            public router: Router,
	            public presenceService: PresenceService) {
	}

	loggedInUserFromAuthServiceSubscription: Subscription;
	searchTextValue: string;
	meetupsArray: Observable<any[]>;
	searchTextControl: any;
	meetupsSubscriptionSnapshots: any[]

	ngOnInit(): void {
		this.meetupsArray = this.afs.collection('PublicMeetups').valueChanges({idField: 'meetupId'});
		this.searchTextControl = new FormControl('', Validators.required);

		this.searchTextControl.valueChanges.subscribe(searchText => {
			// console.log(moment().utc(momentDate).format('LLLL'));
			console.log('searchText:' + searchText);
			this.searchTextValue = searchText;
		});

		this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(loggedInUserDocData => {
			this.loggedInUserDocData = loggedInUserDocData;
			if (loggedInUserDocData &&
				loggedInUserDocData.meetupSubscriptionSnapshots &&
				loggedInUserDocData.meetupSubscriptionSnapshots.length > 0) {
				this.meetupsSubscriptionSnapshots = loggedInUserDocData.meetupSubscriptionSnapshots;
			}
		});
	}

	enterPressed(): void {
		console.log('enter pressed with searchText:' + this.searchTextValue);
		if (this.searchTextValue) {
			const trimmedSearchTextValue = this.searchTextValue.trim();
			if (trimmedSearchTextValue.length > 2) {
				console.log('Greater than 2 characters - need to search for:' + this.searchTextValue);
				this.meetupsArray = null;
				this.meetupsArray = this.afs.collection('PublicMeetups', ref => ref.where('searchKeywords', 'array-contains', this.searchTextValue.toLowerCase())).valueChanges({idField: 'meetupId'});
			}
		} else if (!this.searchTextValue || this.searchTextValue.length === 0) {
			console.log('0 length');
			this.meetupsArray = this.afs.collection('PublicMeetups').valueChanges({idField: 'meetupId'});
		}
	}

	getMeetupNameFontSize(meetupDocData): number {
		if (meetupDocData.name && (meetupDocData.name.length > 18)) {
			return 1.08;
		} else {
			return 1.2;
		}
	}

	isAMemberAlready(meetupId): boolean {
		if (this.meetupsSubscriptionSnapshots) {
			return !!this.meetupsSubscriptionSnapshots.find(meetupFiltered => meetupFiltered.meetupId === meetupId);
		} else {
			return false;
		}
	}

	ngOnDestroy(): void {
		this.loggedInUserFromAuthServiceSubscription.unsubscribe();
	}
}
