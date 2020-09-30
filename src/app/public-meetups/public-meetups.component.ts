import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {AngularFirestore} from "@angular/fire/firestore";
import {Observable} from "rxjs";

@Component({
	selector: 'app-public-meetups',
	templateUrl: './public-meetups.component.html',
	styleUrls: ['./public-meetups.component.scss']
})
export class PublicMeetupsComponent implements OnInit {

	constructor(public afs: AngularFirestore) {
	}

	searchTextValue: string;

	meetupsArray: Observable<any[]>;

	ngOnInit(): void {
		this.meetupsArray = this.afs.collection('PublicMeetups').valueChanges();
		this.searchTextControl.valueChanges.subscribe(searchText => {
			// console.log(moment().utc(momentDate).format('LLLL'));
			console.log('searchText:' + searchText);
			this.searchTextValue = searchText;
		});
	}

	searchTextControl = new FormControl('', Validators.required);

	enterPressed(): void {
		console.log('enter pressed with searchText:' + this.searchTextValue);
		if (this.searchTextValue) {
			let trimmedSearchTextValue = this.searchTextValue.trim();
			if (trimmedSearchTextValue.length > 2) {
				console.log('Greater than 2 characters - need to search for:' + this.searchTextValue);
				this.meetupsArray = null;
				this.meetupsArray = this.afs.collection('PublicMeetups', ref => ref.where('searchKeywords','array-contains', this.searchTextValue.toLowerCase())).valueChanges();
			}
		} else if (!this.searchTextValue || this.searchTextValue.length === 0){
			console.log('0 length');
			this.meetupsArray = this.afs.collection('PublicMeetups').valueChanges();
		}

	}
}
