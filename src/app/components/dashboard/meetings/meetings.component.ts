import {Component, OnInit} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
import {Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import * as moment from 'moment';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ApiService} from '../../../shared/services/api.service';
import {DataService} from '../../../shared/services/data.service';
import {UserService} from '../../../shared/services/user.service';

@Component({
    selector: 'app-meetings',
    templateUrl: './meetings.component.html',
    styleUrls: ['./meetings.component.scss']
})
export class MeetingsComponent implements OnInit {
    user: any;
    userMeetings: any;
    meetupId: string;
    meetupCollection: any;
    meetingCollection: any;
    showSecurityQuestions: boolean;
    questionForm: FormGroup;
    showPastMeetings = false;
    meeting: any;

    constructor(
        private auth: AngularFireAuth,
        public afs: AngularFirestore,
        private router: Router,
        public http: HttpClient,
        private data: DataService,
        public userService: UserService
    ) {
        // get the current user collection
        this.GetUserCollection();
        // get the meetup id from local storage
        // this.meetupId = localStorage.getItem('meetupId') || null;
        //this.data.currentMeetup.subscribe(meetup => this.meetupCollection = meetup);
        this.GetMeetings();
    }

    ngOnInit(): void {
        //this.data.currentMeetup.subscribe(meetup => this.meetupCollection = meetup);      
        
    }

    GetMeetings() {
        this.userService.get_AllMeetings().subscribe(data => {

            this.meeting = data.map(e => {
              return {
                id: e.payload.doc.id,
                name: e.payload.doc.data()['name'],
                date: e.payload.doc.data()['dateValues']["start"],
                joinURL: e.payload.doc.data()['joinURL'],
              };
            })
            console.log(this.meeting);
      
          });         
    }

    /**
     * Get user collection from backend
     * Check if user is anonymous and handle the meeting data
     */
    GetUserCollection() {
        this.auth.idToken.subscribe(data => {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user && user.uid) {
                const userCollection = this.afs.collection('Users').doc(user.uid);
                userCollection.snapshotChanges().subscribe((snapshot) => {
                    this.user = snapshot.payload.data();
                    // if the user is guest, then get meeting data
                    if (this.user.isAnonymous) {
                        this.GetGuestMeeting();
                    } else {
                        // if normal user, then group the meetings
                        this.GroupMeetings();
                    }
                });
            }
        });
    }

    /**
     * Check the meeting has questions to answer
     * This is using when the user is a guest
     */
    get HasQuestions(): boolean {
        return this.meetingCollection && this.meetingCollection.doesMeetupHaveJoiningQs;
    }

    /**
     * Get the related meetup collection if the meeting page requires security questions to answer
     * Checking when the user is a guest
     * Generate the question form once the meetup data get
     */
    HandleMeetupQuestions() {
        if (localStorage.getItem('closed') === 'true') {
            this.showSecurityQuestions = true;
        }
        if (this.HasQuestions && this.meetingCollection.meetupId) {
            console.log('HandleMeetupQuestions');
            this.auth.idToken.subscribe(data => {
                const meetupCollection = this.afs.collection('OnlineMeetups').doc(this.meetingCollection.meetupId);
                meetupCollection.snapshotChanges().subscribe((snapshot) => {
                    this.meetupCollection = snapshot.payload.data();
                    // generate the question form
                    this.GenerateQuestionForm();
                });
            });
        }
    }

    /**
     * Generate security question form
     */
    GenerateQuestionForm() {
        const group = {};
        if (this.meetupCollection.joiningQuestions && this.meetupCollection.joiningQuestions.length > 0) {
            this.meetupCollection.joiningQuestions.forEach((question, key) => {
                group[`question-${key}`] = new FormControl('', Validators.required);
            });
            this.questionForm = new FormGroup(group);
        }
    }

    /**
     * Group the meetings snapshot using the start and end time of the meeting
     */
    GroupMeetings() {
        // if meeting snapshot is present
        if (this.user.meetingSubscriptionSnapshots && this.user.meetingSubscriptionSnapshots.length > 0) {
            // set the meetings
            let meetings = this.user.meetingSubscriptionSnapshots;
            // filter the meetings with the selected meetup id
            meetings = meetings.filter(meeting => {
                return meeting.meetupId === this.meetupId;
            });
            let group = [];
            // loop the meetings
            for (let meeting of meetings) {
                // get the formatted time to show in table
                meeting.time = this.MeetingTime(meeting.startsAt, meeting.endsAt);
                // get the button details using the time
                const buttonObject = this.Button(meeting.startsAt, meeting.endsAt);
                // merge the button data
                meeting = {...meeting, ...buttonObject};
                let groupName = '';
                let date = null;
                // group the meetings according to the time
                if (meeting && meeting.startsAt && meeting.startsAt.seconds) {
                    groupName = moment.unix(meeting.startsAt.seconds).format('dddd, MMMM D');
                    date = moment.unix(meeting.startsAt.seconds).format('YYYY-MM-DD');
                } else {
                    groupName = 'Not scheduled';
                }
                const singleObject = group.find(g => g.groupName === groupName);
                if (singleObject) {
                    singleObject.items.push(meeting);
                } else {
                    group.push({
                        groupName,
                        date,
                        items: [meeting]
                    });
                }
            }
            // sort the list by date of meeting
            group.sort((a, b) => {
                // @ts-ignore
                return this.GetDate(a.date) - this.GetDate(b.date);
            });
            // get the non-scheduled item
            const notScheduledIndex = group.findIndex(g => !g.date);
            // if non-scheduled item
            if (notScheduledIndex > -1) {
                // sort to last entry
                const notScheduled = group.splice(notScheduledIndex, 1);
                group = [...group, ...notScheduled];
            }
            this.SortPastMeeting(group);
            // set the grouped meetings to the variable, it will show in view
            this.userMeetings = group;
        }
    }

    /**
     * Set flags to groups to check if the group is past
     */
    SortPastMeeting(group) {
        group.map(g => {
            g.isPastMeeting = g.items && g.items.length > 0 && !!g.items.find(i => i.isPastMeeting);
        });
    }

    /**
     * Create meeting group list for guest user
     */
    GroupGuestMeeting(meeting) {
        const group = [];
        let item = meeting;
        let groupName = 'Not Scheduled';
        let date = null;
        if (meeting.dateValues.start && meeting.dateValues.end) {
            const start = moment(meeting.dateValues.start);
            const end = moment(meeting.dateValues.end);
            item = {time: `${start.format('HH:mm')} - ${end.format('HH:mm A')}`, ...item};
            const buttonObject = this.GuestButton(meeting.dateValues.start, meeting.dateValues.end);
            item = {...item, ...buttonObject};
            groupName = moment(meeting.dateValues.start).format('dddd, MMMM D');
            date = moment(meeting.dateValues.start).format('YYYY-MM-DD');
        }
        group.push({
            groupName,
            date,
            items: [item]
        });
        this.userMeetings = group;
    }

    /**
     * Get moment object of date
     */
    GetDate(date) {
        return date ? moment(date) : 1;
    }

    /**
     * Get meeting for the guest
     * Assign the meeting data to userMeeting variable and it will appear in the view
     */
    GetGuestMeeting() {
        const meetingId = localStorage.getItem('meetingUuid');
        if (meetingId) {
            const apiUri = `https://us-central1-online-meetups-e955d.cloudfunctions.net/api/meetinguuids/${meetingId}`;
            this.auth.idToken.subscribe(token => {
                if (token) {
                    const headers = {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + token
                    };
                    this.http.get<any>(apiUri, {headers}).subscribe(data => {
                        if (data && data.uuid) {
                            this.meetingCollection = data;
                            this.GroupGuestMeeting(data);
                            this.HandleMeetupQuestions();
                        }
                    });
                }
            });
        }
    }

    /**
     * Navigate to invite page
     */
    InviteMeeting(e, meeting) {
        e.preventDefault();
        this.router.navigate([`/dashboard/meeting/${meeting.meetingId}/invite`]);
    }

    /**
     * Check if user is a guest
     */
    get isUserGuest(): boolean {
        return this.user.isAnonymous || false;
    }

    /**
     * Get the time of the meeting in format
     */
    MeetingTime(startAt, endAt) {
        if (startAt && endAt && startAt.seconds && endAt.seconds) {
            const start = moment.unix(startAt.seconds);
            const end = moment.unix(endAt.seconds);
            return `${start.format('HH:mm')} - ${end.format('HH:mm A')}`;
        } else {
            return 'Not scheduled';
        }
    }

    /**
     * Get the button details
     * Includes, if the button should show or not
     * Button text to show
     * If the meeting is past meeting
     */
    Button(startAt, endAt) {
        const object = {
            buttonText: '',
            showButton: true,
            isPastMeeting: false
        };
        if (startAt && endAt && startAt.seconds && endAt.seconds) {
            const time = moment();
            const startTime = moment.unix(startAt.seconds);
            const endTime = moment.unix(endAt.seconds);
            if (time < startTime) { // if the meeting is in future
                object.buttonText = 'Join';
                object.showButton = false;
            } else if (time > startTime && time < endTime) { // on going meeting
                object.buttonText = 'Join Meeting in Progress';
            } else { // past meeting
                object.isPastMeeting = true;
                object.showButton = false;
            }
        } else {
            object.showButton = false;
        }
        return object;
    }

    /**
     * Button object for guest user meeting
     * For guest user, fetching meeting collection instead of snapshot
     */
    GuestButton(start, end) {
        const object = {
            buttonText: '',
            showButton: true,
            isPastMeeting: false
        };

        const time = moment();
        if (time < moment(start)) { // if the meeting is in future
            object.buttonText = 'Join';
            object.showButton = false;
        } else if (time > moment(start) && time < moment(end)) { // on going meeting
            object.buttonText = 'Join Meeting in Progress';
        } else { // past meeting
            object.isPastMeeting = true;
            object.showButton = false;
        }
        return object;
    }

    /**
     * Go to the meeting link by fetching the meeing data
     */
    goToLink(e, meeting) {
        e.preventDefault();
        // get the meeting
        this.GetMeeting(meeting.meetingId);
    }

    /**
     * Fetch the meeting using meeting id
     */
    GetMeeting(meetingId) {
        let meeting: any;
        this.auth.idToken.subscribe(data => {
            const meetingCollection = this.afs.collection('Meetings').doc(meetingId);
            meetingCollection.snapshotChanges().subscribe((snapshot) => {
                meeting = snapshot.payload.data();
                // open the meeting url in new tab
                window.open(meeting.zoomMeetingJoinUrl, '_blank');
            });
        });
    }

    /**
     * Returns the security questions
     */
    get JoiningQuestions(): any {
        return this.meetupCollection.joiningQuestions || [];
    }

    /**
     * On submitting the security question form
     * Todo: submit and check if the answers are correct
     * If yes, show security questions
     */
    SubmitQuestions(e) {
        e.preventDefault();
        if (this.questionForm.invalid) {
            return false;
        }
        console.log(this.questionForm.value);
        localStorage.setItem('closed', 'false');
        this.showSecurityQuestions = false;
    }

    /**
     * Show past meetings in the list
     * Past meetings will be hidden in the list
     */
    ShowPastMeetings(e) {
        e.preventDefault();
        this.showPastMeetings = !this.showPastMeetings;
    }
}
