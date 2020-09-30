import {Component, NgZone, OnInit} from '@angular/core';

import {AuthService} from '../../shared/services/auth.service';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';

@Component({
    selector: 'app-sign-up',
    templateUrl: './sign-up.component.html',
    styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnInit {

    signUpForm: FormGroup;
    tempUser: any;

    constructor(
        public authService: AuthService,
        public auth: AngularFireAuth, // Inject Firebase auth service,
        public afs: AngularFirestore,   // Inject Firestore service,
        public ngZone: NgZone, // NgZone service to remove outside scope warning
        private router: Router
    ) {
        this.tempUser = JSON.parse(localStorage.getItem('temp-user'));
    }

    ngOnInit(): void {
        this.signUpForm = new FormGroup({
            name: new FormControl(this.tempUser.displayName, Validators.required),
            email: new FormControl(this.tempUser.email, Validators.required),
            contact: new FormControl('')
        });
    }

    async SubmitSignUpForm(e) {
        e.preventDefault();
        if (this.signUpForm.invalid) {
            return false;
        }
        const formData = this.signUpForm.value;
        this.tempUser.email = formData.email;
        this.tempUser.contact = formData.contact;
        this.tempUser.displayName = formData.name;
        this.tempUser.isSignedUp = true;
        localStorage.setItem('displayName', formData.name);
        await this.SaveSignedUpUser(this.tempUser);
    }

    /**
     * Handle user data once the sign up form filled and submitted
     * The user data includes the form data entered
     */
    async SaveSignedUpUser(user) {
        localStorage.setItem('isAuth', 'true');
        console.log(user);
        // save the updated user data to firebase store
        this.auth.idToken.subscribe(data => {
            const userCollection = this.afs.collection<any>('Users').doc(user.uid);
            userCollection.update({
                /*auth: {uid: user.uid},*/
                uid: user.uid,
                email: user.email,
                phoneNumber: user.contact, /*|| null,*/
                isSignedUp: user.isSignedUp || false,
                displayName: user.displayName,
                photoURL: user.photoURL,
                emailVerified: user.emailVerified,
            });
        });
        localStorage.removeItem('temp-user');

        // // redirect to dashboard
        this.ngZone.run(() => {
            setTimeout(() => {
                this.router.navigate(['dashboard']);
            }, 100);
        });
    }

    /**
     * Redirect back to sign in page
     * Clear the temp user
     */
    RedirectToSignIn(e) {
        e.preventDefault();
        localStorage.setItem('temp-user', null);
        this.authService.signOut();
    }
}
