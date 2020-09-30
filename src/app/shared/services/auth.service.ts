import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';

import { auth } from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';

import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';


@Injectable({
    providedIn: 'root'
})
export class AuthService {

  firebaseUser$: Observable<any>;
  isAnonymous: boolean;

  constructor(private afAuth: AngularFireAuth, private afs: AngularFirestore, private router: Router) {
    this.firebaseUser$ = this.afAuth.authState.pipe(
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
    return this.firebaseUser$ !== null;
  }

  private updateUserData(user) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(`Users/${user.uid}`);
    const data = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    };
    return userRef.set(data, { merge: true });
  }

  async googleSignin() {
    const provider = new auth.GoogleAuthProvider();
    return this.socialMediaProviderSignin(provider, 'google');
  }

  async facebookSignin() {
    const provider = new auth.FacebookAuthProvider();
    return this.socialMediaProviderSignin(provider, 'facebook');
  }

  async appleSignin() {
    const provider = new auth.OAuthProvider('apple.com');
    return this.socialMediaProviderSignin(provider, 'apple');
  }

  async anonymousSignin() {
    const credential = await this.afAuth.signInAnonymously();
    return this.updateUserData(credential.user);
  }

  private async socialMediaProviderSignin(provider, providerName) {
    const credential = await this.afAuth.signInWithPopup(provider);
    localStorage.setItem('loginType', providerName);
    localStorage.setItem('displayName', credential.user.displayName);
    return this.updateUserData(credential.user);
  }

  passwordlesSignin(email) {
    const actionCodeSettings = {
        // URL you want to redirect back to. The domain (www.example.com) for this
        // URL must be whitelisted in the Firebase Console.
        url: `${document.location.origin}/finish-email-sign-in`,
        // This must be true.
        handleCodeInApp: true
    };
    localStorage.setItem('loginType', 'email');
    this.afAuth.sendSignInLinkToEmail(email, actionCodeSettings)
        .then(() => {
            // The link was successfully sent. Inform the user.
            // Save the email locally so you don't need to ask the user for it again
            // if they open the link on the same device.
            window.localStorage.setItem('emailForSignIn', email);
            window.alert('Login email sent, check your inbox.');
            this.router.navigate(['sign-in']);
        })
        .catch((error) => {
            console.error('failed', error);
            // Some error occurred, you can inspect the code: error.code
        });
  }

  EmailAuthCallback() {
    // Confirm the link is a sign-in with email link.
    if (this.afAuth.isSignInWithEmailLink(window.location.href)) {
        // Additional state parameters can also be passed via URL.
        // This can be used to continue the user's intended action before triggering
        // the sign-in operation.
        // Get the email if available. This should be available if the user completes
        // the flow on the same device where they started it.
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
            // User opened the link on a different device. To prevent session fixation
            // attacks, ask the user to provide the associated email again. For example:
            email = window.prompt('Please provide your email for confirmation');
            window.localStorage.setItem('emailForSignIn', email);
        }
        // The client SDK will parse the code from the link for you.
        this.afAuth.signInWithEmailLink(email, window.location.href)
            .then((result) => {
                localStorage.setItem('loginType', 'email');
                localStorage.setItem('displayName', result.user.displayName);
                // this.SetUserData(result.user);
                // Clear email from storage.
                window.localStorage.removeItem('emailForSignIn');
                // You can access the new user via result.user
                // Additional user info profile not available via:
                // result.additionalUserInfo.profile == null
                // You can check if the user is new or existing:
                // result.additionalUserInfo.isNewUser
                // this.ngZone.run(() => {
                //     setTimeout(() => {
                //         this.router.navigate(['dashboard']);
                //     }, 100);
                // });
            })
            .catch((error) => {
                // Some error occurred, you can inspect the code: error.code
                // Common errors could be invalid email and invalid or expired OTPs.
            });
    }
}

  signOut(): void {
    this.afAuth.signOut();
    this.router.navigate(['/']);
  }

}
