import {Injectable, NgZone} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {auth} from 'firebase/app';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';

import {Observable, of} from 'rxjs';
import {switchMap} from 'rxjs/operators';


@Injectable({
	providedIn: 'root'
})
export class AuthService {

	loggedInUserFromAuthService$: Observable<any>;
	isAnonymous: boolean;
	frompm: string;
	returnUrl: string;
	meetupId: string;
	forJoiningMeetup: boolean;
	private forJoiningMeeting: boolean;
	private meetingUuid: string;

	constructor(private afAuth: AngularFireAuth, private afs: AngularFirestore, private router: Router, private route: ActivatedRoute) {
		this.loggedInUserFromAuthService$ = this.afAuth.authState.pipe(
			switchMap(user => {
				if (user) {
					this.isAnonymous = user.isAnonymous;
					return this.afs.doc<any>(`Users/${user.uid}`).valueChanges();
				} else {
					return of(null);
				}
			})
		);
	}

	get isAuthenticated(): boolean {
		return this.loggedInUserFromAuthService$ !== null;
	}

	private updateUserData(user, queryParams) {
		const userRef: AngularFirestoreDocument<any> = this.afs.doc(`Users/${user.uid}`);
		/*const data = {
			uid: user.uid,
			email: user.email,
			displayName: user.displayName,
			photoURL: user.photoURL
		};*/
		console.log('reached here - before forwarding to sign-up');
		//await userRef.set(data, {merge: true});
		this.router.navigate(['sign-up'], {queryParams: queryParams});
	}

	async googleSignin(queryParams) {
		const provider = new auth.GoogleAuthProvider();
		return this.socialMediaProviderSignin(provider, 'google', queryParams);
	}

	async facebookSignin(queryParams) {
		const provider = new auth.FacebookAuthProvider();
		return this.socialMediaProviderSignin(provider, 'facebook', queryParams);
	}

	async appleSignin(queryParams) {
		const provider = new auth.OAuthProvider('apple.com');
		return this.socialMediaProviderSignin(provider, 'apple', queryParams);
	}

	async anonymousSignin() {
		const credential = await this.afAuth.signInAnonymously();
		return this.updateUserData(credential.user, {});
	}

	private async socialMediaProviderSignin(provider, providerName, queryParams) {
		const credential = await this.afAuth.signInWithPopup(provider);
		localStorage.setItem('loginType', providerName);
		localStorage.setItem('displayName', credential.user.displayName);
		return this.updateUserData(credential.user, queryParams);
	}

	async passwordlesSignin(email, queryParamString) {
		const actionCodeSettings = {
			// URL you want to redirect back to. The domain (www.example.com) for this
			// URL must be whitelisted in the Firebase Console.
			url: `${document.location.origin}/finish-email-sign-in` + (queryParamString ? queryParamString : ''),
			handleCodeInApp: true
		};
		localStorage.setItem('loginType', 'email');
		this.afAuth.sendSignInLinkToEmail(email, actionCodeSettings)
			.then(() => {
				window.localStorage.setItem('emailForSignIn', email);
				/*window.alert('Login email sent, check your inbox.');*/
				//this.router.navigate(['sign-in']);
			})
			.catch((error) => {
				console.error('Sending Sign-In link to Email failed', error);
				throw error;
			});
	}

	EmailAuthCallback() {
		// Confirm the link is a sign-in with email link.
		if (this.route.snapshot.queryParams['frompm']) {
			this.frompm = this.route.snapshot.queryParams['frompm'];
			this.returnUrl = this.route.snapshot.queryParams['returnUrl'];
			this.meetupId = this.route.snapshot.queryParams['mid'];
			this.forJoiningMeetup = true;
		} else if (this.route.snapshot.queryParams['meetingUuid']) {
			// get the meeting id from the url parameter
			this.meetingUuid = this.route.snapshot.queryParams['meetingUuid'];
			this.returnUrl = this.route.snapshot.queryParams['returnUrl'];
			this.forJoiningMeeting = true;
		}

		if (this.afAuth.isSignInWithEmailLink(window.location.href)) {
			let email = window.localStorage.getItem('emailForSignIn');
			if (!email) {
				email = window.prompt('Please provide your email for confirmation');
				window.localStorage.setItem('emailForSignIn', email);
			}
			this.afAuth.signInWithEmailLink(email, window.location.href)
				.then((result) => {
					localStorage.setItem('loginType', 'email');
					localStorage.setItem('displayName', result.user.displayName);
					window.localStorage.removeItem('emailForSignIn');
					if (this.forJoiningMeeting) {
						this.updateUserData(result, {returnUrl: this.returnUrl, meetingUuid: this.meetingUuid});
					} else if (this.forJoiningMeetup) {
						this.updateUserData(result, {frompm: this.frompm, mid: this.meetupId});
					} else {
						this.updateUserData(result, {});
					}

				})
				.catch((error) => {
				});
		}
	}

	signOut(): void {
		this.afAuth.signOut().then(() => {
			console.log('signed out');
			localStorage.removeItem('emailForSignIn');
			this.router.navigate(['sign-in']);
		});
	}

}
