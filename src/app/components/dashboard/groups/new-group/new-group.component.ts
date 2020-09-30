import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {AuthService} from '../../../../shared/services/auth.service';
import {ApiService} from '../../../../shared/services/api.service';
import {Subscription} from "rxjs";
import {MeetupInContextService} from "../../../../shared/services/meetup-in-context.service";
import {AngularFirestore} from "@angular/fire/firestore";
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {ToastrService} from "ngx-toastr";
import {AngularFireFunctions} from "@angular/fire/functions";
import {Router} from "@angular/router";

@Component({
    selector: 'app-new-group',
    templateUrl: './new-group.component.html',
    styleUrls: ['./new-group.component.scss'],
})
export class NewGroupComponent implements OnInit {
    openAdminsPanel = false;
    openMembersPanel = false;
    FilterStatus = false;
    config = [];
    public loggedInUserFromAuthServiceSubscription: Subscription;
    public loggedInUserDocData: any;
    public meetupList: any[];
    public meetupId: string;
    public meetupSubscriptionSnapshot: any;
    public meetupRole: any;
    public selectedMeetupDocData: any;
    public newGroupForm: FormGroup;

    public trustedMembers: any;

    adminMembersArrayFormGroup = new FormGroup({
        adminMembersCheckboxesArray: this.fb.array([])
    });

    membersArrayFormGroup = new FormGroup({
        membersCheckboxesArray: this.fb.array([])
    });

    constructor(
        public meetupInContextService: MeetupInContextService,
        public authService: AuthService,
        private afs: AngularFirestore,
        public fb: FormBuilder,
        private toastrService: ToastrService,
        private fns: AngularFireFunctions,
        private ref: ChangeDetectorRef,
        private router: Router
    ) {
        const navigation = this.router.getCurrentNavigation();

        this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(firebaseUser => {
            this.loggedInUserDocData = firebaseUser;
            if (firebaseUser &&
                firebaseUser.meetupSubscriptionSnapshots &&
                firebaseUser.meetupSubscriptionSnapshots.length > 0) {

                this.meetupList = firebaseUser.meetupSubscriptionSnapshots;

                if (this.meetupId) {
                    this.meetupSubscriptionSnapshot = firebaseUser.meetupSubscriptionSnapshots.find((m) => m.meetupId === this.meetupId);
                }

                let meetupDocumentSnapshot;
                if (!this.meetupInContextService.meetupInContext && !this.meetupId) {
                    if (this.loggedInUserDocData.meetupSubscriptionSnapshots && this.loggedInUserDocData.meetupSubscriptionSnapshots.length > 0) {
                        if (firebaseUser.lastMeetupInContextId) {
                            if (firebaseUser.meetupSubscriptionSnapshots.some(meetup => meetup.meetupId === firebaseUser.lastMeetupInContextId)) {
                                this.meetupSubscriptionSnapshot = firebaseUser.meetupSubscriptionSnapshots.find(meetupSnapshot => meetupSnapshot.meetupId === firebaseUser.lastMeetupInContextId)
                            }
                        } else {
                            this.meetupSubscriptionSnapshot = firebaseUser.meetupSubscriptionSnapshots[0];
                            if (this.meetupSubscriptionSnapshot && this.meetupSubscriptionSnapshot.role && this.meetupSubscriptionSnapshot.role.length > 0) {
                                this.meetupRole = this.meetupSubscriptionSnapshot.role[0];
                            }
                        }
                        this.meetupId = this.meetupSubscriptionSnapshot.meetupId;
                    }

                    meetupDocumentSnapshot = this.afs.collection('OnlineMeetups').doc(this.meetupId);
                    meetupDocumentSnapshot.snapshotChanges().subscribe((snapshot) => {
                        this.selectedMeetupDocData = snapshot.payload.data();
                        this.meetupInContextService.meetupInContextSubject.next(this.selectedMeetupDocData);

                        this.afs.collection('OnlineMeetups')
                            .doc(this.selectedMeetupDocData.id).collection('members', ref =>
                            ref.where('isTrusted', '==', true)).snapshotChanges().subscribe((memberList) => {
                            this.trustedMembers = memberList.filter((meetingDocChangeAction) =>
                                meetingDocChangeAction.payload.doc.data().userId !== this.loggedInUserDocData.uid
                            ).map((meetingDocChangeAction) => {
                                if (meetingDocChangeAction.payload.doc.data().userId !== this.loggedInUserDocData.uid) {
                                    return meetingDocChangeAction.payload.doc.data()
                                }
                            });
                        });

                    });
                } else {
                    this.selectedMeetupDocData = this.meetupInContextService.meetupInContext;
                    this.meetupSubscriptionSnapshot = firebaseUser.meetupSubscriptionSnapshots.find((m) => m.meetupId === this.selectedMeetupDocData.id);
                    this.meetupId = this.meetupSubscriptionSnapshot.meetupId;

                    if (this.meetupSubscriptionSnapshot && this.meetupSubscriptionSnapshot.role && this.meetupSubscriptionSnapshot.role.length > 0) {
                        this.meetupRole = this.meetupSubscriptionSnapshot.role[0];
                    }

                    this.afs.collection('OnlineMeetups')
                        .doc(this.selectedMeetupDocData.id).collection('members', ref =>
                        ref.where('isTrusted', '==', true)).snapshotChanges().subscribe((memberList) => {
                        this.trustedMembers = memberList.filter((meetingDocChangeAction) =>
                            meetingDocChangeAction.payload.doc.data().userId !== this.loggedInUserDocData.uid
                        ).map((meetingDocChangeAction) => {
                            if (meetingDocChangeAction.payload.doc.data().userId !== this.loggedInUserDocData.uid) {
                                return meetingDocChangeAction.payload.doc.data()
                            }
                        });
                    });

                }
            }
        });
    }

    ngOnInit(): void {
        this.newGroupForm = this.fb.group({
            name: ['', Validators.required],
            description: ['', Validators.required]
        })
    }

    get adminMembersCheckboxesArray(): FormArray {
        return this.adminMembersArrayFormGroup.get('adminMembersCheckboxesArray') as FormArray;
    }

    public onCheckboxChangeAdmins(member, event): void {
        if (event.target.checked) {
            this.adminMembersCheckboxesArray.push(new FormControl(event.target.value));
        } else {
            let i: number = 0;
            this.adminMembersCheckboxesArray.controls.forEach((item: FormControl) => {
                if (item.value == event.target.value) {
                    this.adminMembersCheckboxesArray.removeAt(i);
                    return;
                }
                i++;
            });
        }
        console.log('adminMembersCheckboxesArray:' + JSON.stringify(this.adminMembersCheckboxesArray.value, undefined, 4));
    }

    closeAdminMembersPanelWithClearingData($event) {
        $event.preventDefault();
        this.adminMembersCheckboxesArray.clear();
        this.openAdminsPanel = false;
    }

    closeAdminMembersPanelWoClearingData($event) {
        $event.preventDefault();
        this.openAdminsPanel = false;
    }


    get membersCheckboxesArray(): FormArray {
        return this.membersArrayFormGroup.get('membersCheckboxesArray') as FormArray;
    }

    public onCheckboxChangeMembers(member, event): void {
        if (event.target.checked) {
            this.membersCheckboxesArray.push(new FormControl(event.target.value));
        } else {
            let i: number = 0;
            this.membersCheckboxesArray.controls.forEach((item: FormControl) => {
                if (item.value == event.target.value) {
                    this.membersCheckboxesArray.removeAt(i);
                    return;
                }
                i++;
            });
        }
        console.log('membersCheckboxesArray:' + JSON.stringify(this.membersCheckboxesArray.value, undefined, 4));
    }

    closeMembersPanelWithClearingData($event) {
        $event.preventDefault();
        this.membersCheckboxesArray.clear();
        this.openMembersPanel = false;
    }

    closeMembersPanelWoClearingData($event) {
        $event.preventDefault();
        this.openMembersPanel = false;
    }

    formSubmit(){
        console.log('form submitted');
    }

    showMembersPanel($event) {
        $event.preventDefault();
        this.openMembersPanel = true;
        this.openAdminsPanel = false;
    }

    showAdminsPanel($event) {
        $event.preventDefault();
        this.openAdminsPanel = true;
        this.openMembersPanel = false;
    }

    FilterPanel($event) {
        $event.preventDefault();
        this.FilterStatus = true;
    }
}
