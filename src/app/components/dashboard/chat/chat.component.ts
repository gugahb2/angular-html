import {Component, OnInit, ElementRef, ViewChild, ViewEncapsulation} from '@angular/core';
import {Observable, of, Subscription} from "rxjs";
import {MeetupInContextService} from "../../../shared/services/meetup-in-context.service";
import {AuthService} from "../../../shared/services/auth.service";
import {AngularFirestore} from "@angular/fire/firestore";
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {delay, first, take} from "rxjs/operators";
import {ToastrService} from "ngx-toastr";
import {AngularFireFunctions} from "@angular/fire/functions";
import {ChangeDetectorRef} from '@angular/core'
import {firestore} from "firebase";
import PerfectScrollbar from 'perfect-scrollbar';
import {Router} from "@angular/router";

@Component({
	selector: 'app-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['./chat.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class ChatComponent implements OnInit {
	@ViewChild('chatBlockPhoto') chatBlockEl: ElementRef;
	private meetupSubscriptionSnapshot: any;
	private loggedInUserFromAuthServiceSubscription: Subscription;
	public loggedInUserDocData: any;
	private meetupList: any;
	private meetupId: string;
	public selectedMeetupDocData: any;
	public trustedMembers: any;
	private userRolesInMeetup: any;
	public searchTextControl: FormControl;
	public chatMessageTextControl: FormControl;
	public searchTextValue: string;
	public chatMessageValue: string;
	message: string = ''; // the  message to be sent
	newChatFormGroup = new FormGroup({
		trustedMembersCheckboxesArray: this.fb.array([])
	});
	public currentChatMessagesSubscription: Subscription;
	public currentChatMessagesList: any[];
	public openChatId: string;
	private currentChatSubscription: Subscription;
	public currentChatDocument: any;
	private recentChatsSubscription: Subscription;
	public recentChatsList: any[];
	public fromHomePageOpenChat: boolean;
	public chatIdFromHomePage: string;
	public groupsList: any[];
	public meetupRole: string;
	public fromGroupsPageOpenGroupChat: boolean;
	public groupIdFromGroupsPage: string;
	public groupNameFromGroupsPage: string;

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
		const state = navigation?.extras?.state;
		if (state && state.chatId) {
			this.fromHomePageOpenChat = true;
			this.chatIdFromHomePage = state.chatId;
		} else if (state && state.groupId) {
			this.fromGroupsPageOpenGroupChat = true;
			this.groupIdFromGroupsPage = state.groupId;
			this.groupNameFromGroupsPage = state.groupName;
		}

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

						if (this.fromHomePageOpenChat && this.chatIdFromHomePage) {
							this.openRecentChatInMainSection({chatId: this.chatIdFromHomePage})
						} else if (this.fromGroupsPageOpenGroupChat) {
							this.openGroupChatInMainSection(({id: this.groupIdFromGroupsPage, name: this.groupNameFromGroupsPage}));
						}

						this.afs.collection('Groups', ref =>
							ref.where('meetupId', '==', this.selectedMeetupDocData.id))
							.snapshotChanges()
							.subscribe((groupDocChangeActionList) => {
								this.groupsList = groupDocChangeActionList.map((groupDocChangeAction) => {
									let groupObject: any = groupDocChangeAction.payload.doc.data();
									groupObject.id = groupDocChangeAction.payload.doc.id;
									return groupObject;
								});
							});

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

							this.recentChatsSubscription = this.afs.collection('OnlineMeetups').doc(this.selectedMeetupDocData.id)
								.collection('members').doc(this.loggedInUserDocData.uid)
								.snapshotChanges()
								.subscribe((memberDocumentSnapshot: any) => {
									this.recentChatsList = memberDocumentSnapshot
										.payload.data()
										.recentChats?.filter(recentChat => !recentChat.isGroupChat)
										.map((recentChat) => {
											let chatterItem = {
												chatterNames: recentChat.userSnapshots.reduce((accumulatedStr, currentValue, currentIndex, array) => {
														if (this.loggedInUserDocData.uid !== currentValue.userId) {
															return (accumulatedStr === '' ? (accumulatedStr) : accumulatedStr + ',') + currentValue.displayName
														} else {
															return accumulatedStr;
														}
													}, ''
												),
												recentMessages: recentChat.recentMessages[0].text,
												userImages: recentChat.userSnapshots
													.filter(userSnapshot => this.loggedInUserDocData.uid !== userSnapshot.userId)
													.map(userSnapshot => userSnapshot.photoURL),
												chatId: recentChat.chatId,
												userIds: recentChat
													.userSnapshots.filter(userSnapshot => this.loggedInUserDocData.uid !== userSnapshot.userId)
													.map(userSnapshot => userSnapshot.userId)
											}
											console.log('chatterItem:' + JSON.stringify(chatterItem));
											return chatterItem;
										});
									ref.detectChanges();
								});

						});
					});
				} else {
					this.selectedMeetupDocData = this.meetupInContextService.meetupInContext;
					this.meetupSubscriptionSnapshot = firebaseUser.meetupSubscriptionSnapshots.find((m) => m.meetupId === this.selectedMeetupDocData.id);
					this.meetupId = this.meetupSubscriptionSnapshot.meetupId;

					if (this.fromHomePageOpenChat && this.chatIdFromHomePage) {
						this.openRecentChatInMainSection({chatId: this.chatIdFromHomePage})
					} else if (this.fromGroupsPageOpenGroupChat) {
						this.openGroupChatInMainSection({id: this.groupIdFromGroupsPage, name: this.groupNameFromGroupsPage});
					}

					this.afs.collection('Groups', ref =>
						ref.where('meetupId', '==', this.selectedMeetupDocData.id))
						.snapshotChanges()
						.subscribe((groupList) => {
							this.groupsList = groupList.map((groupDocChangeAction) => {
								let groupObject: any = groupDocChangeAction.payload.doc.data();
								groupObject.id = groupDocChangeAction.payload.doc.id;
								return groupObject;
							});

						});

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
						this.recentChatsSubscription = this.afs.collection('OnlineMeetups').doc(this.selectedMeetupDocData.id)
							.collection('members').doc(this.loggedInUserDocData.uid)
							.snapshotChanges()
							.subscribe((memberDocumentSnapshot: any) => {
								this.recentChatsList = memberDocumentSnapshot.payload.data()
									.recentChats?.filter(recentChat => !recentChat.isGroupChat)
									.map((recentChat) => {
										let chatterItem = {
											chatterNames: recentChat.userSnapshots.reduce((accumulatedStr, currentValue, currentIndex, array) => {
													if (this.loggedInUserDocData.uid !== currentValue.userId) {
														return (accumulatedStr === '' ? (accumulatedStr) : accumulatedStr + ',') + currentValue.displayName
													} else {
														return accumulatedStr;
													}
												}, ''
											),
											recentMessages: recentChat.recentMessages[0].text,
											userImages: recentChat.userSnapshots
												.filter(userSnapshot => this.loggedInUserDocData.uid !== userSnapshot.userId)
												.map(userSnapshot => userSnapshot.photoURL),
											chatId: recentChat.chatId,
											userIds: recentChat
												.userSnapshots.filter(userSnapshot => this.loggedInUserDocData.uid !== userSnapshot.userId)
												.map(userSnapshot => userSnapshot.userId)
										}
										console.log('chatterItem:' + JSON.stringify(chatterItem));
										return chatterItem;
									});
								ref.detectChanges();
							});
					});
				}

				if (this.meetupSubscriptionSnapshot && this.meetupSubscriptionSnapshot.role && this.meetupSubscriptionSnapshot.role.length > 0) {
					this.userRolesInMeetup = this.meetupSubscriptionSnapshot.role;
				}
			}
		});
	}

	status = true;
	showGroupBasedFiltering: boolean = false;
	showExtraFilterOptionsSidePanel = false;
	chatBlockHoverd = false;
	config = [];
	openUserChat = false;
	moreOptionPanel = false;

	ngOnInit(): void {
		this.searchTextControl = new FormControl('', Validators.required);

		this.searchTextControl.valueChanges.subscribe(searchText => {
			console.log('searchText:' + searchText);
			this.searchTextValue = searchText;
		});

		this.chatMessageTextControl = new FormControl('', Validators.required);
		this.chatMessageTextControl.valueChanges.subscribe(chatMessage => {
			this.chatMessageValue = chatMessage;
		});
	}

	enterPressed(): void {
		console.log('enter pressed with searchText:' + this.searchTextValue);
		if (this.searchTextValue) {
			const trimmedSearchTextValue = this.searchTextValue.trim();
			if (trimmedSearchTextValue.length > 2) {
				console.log('Greater than 2 characters - need to search for:' + this.searchTextValue);
				this.afs.collection('OnlineMeetups')
					.doc(this.selectedMeetupDocData.id).collection('members', ref =>
					ref.where('isTrusted', '==', true).where('displayNameKeywords', 'array-contains', this.searchTextValue.toLowerCase())).snapshotChanges().subscribe((memberList) => {
					this.trustedMembers = memberList.filter((meetingDocChangeAction) =>
						meetingDocChangeAction.payload.doc.data().userId !== this.loggedInUserDocData.uid
					).map((meetingDocChangeAction) => {
						if (meetingDocChangeAction.payload.doc.data().userId !== this.loggedInUserDocData.uid) {
							return meetingDocChangeAction.payload.doc.data()
						}
					});
				});
			}
		} else if (!this.searchTextValue || this.searchTextValue.length === 0) {
			console.log('0 length');
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

	chatPanel($event) {
		$event.preventDefault();
		this.showGroupBasedFiltering = true;
	}

	sendMessage() {
		// If message string is empty
		if (this.chatMessageValue == '') {
			alert('Enter message');
			return;
		}

		console.log('chat message to send:' + this.chatMessageValue);
		//set the message object
		let msg = {
			senderUserId: this.loggedInUserDocData.uid,
			text: this.chatMessageValue,
			createdAt: firestore.FieldValue.serverTimestamp()
		};
		//empty message
		this.chatMessageTextControl.setValue('');
		this.ref.detectChanges();
		this.afs.collection('OnlineMeetups').doc(this.selectedMeetupDocData.id).collection('chats').doc(this.openChatId).collection('messages').add(msg).then(
			documentRef => documentRef.id
		);
		//update
		/*this.messages.push(msg);
		console.log('list', this.messages);
		this.api.pushNewMessage(this.messages).then(() => {
			console.log('sent');
		})*/
	}

	toggleExtraFilterOptionsSidePanel($event) {
		$event.preventDefault();
		this.showExtraFilterOptionsSidePanel = !this.showExtraFilterOptionsSidePanel;
	}

	get trustedMembersCheckboxesArray(): FormArray {
		return this.newChatFormGroup.get('trustedMembersCheckboxesArray') as FormArray;
	}

	public onCheckboxChange(member, event): void {
		if (event.target.checked) {
			this.trustedMembersCheckboxesArray.push(new FormControl(event.target.value));
		} else {
			let i: number = 0;
			this.trustedMembersCheckboxesArray.controls.forEach((item: FormControl) => {
				if (item.value == event.target.value) {
					this.trustedMembersCheckboxesArray.removeAt(i);
					return;
				}
				i++;
			});
		}
		console.log('trustedMembersCheckboxesArray' + this.trustedMembersCheckboxesArray);
	}

	createNewChatOrOpenExisting($event) {
		$event.preventDefault();
		let formData = this.newChatFormGroup.value;
		const callable = this.fns.httpsCallable(`createChat`);
		if (!this.trustedMembersCheckboxesArray || this.trustedMembersCheckboxesArray.length === 0) {
			//TODO -- show message in UI
			this.newChatFormGroup.get('trustedMembersCheckboxesArray').setErrors({'mandatory': true});
			return;
		}
		this.showGroupBasedFiltering = false;
		try {
			let chattersSet = new Set(formData.trustedMembersCheckboxesArray);
			let apiResponse = callable({
				userIds: Array.from(chattersSet),
				meetupId: this.selectedMeetupDocData.id
			})
				.pipe(first())
				.subscribe(resp => {
					console.log({resp});
					if (resp.chatId) {
						this.openChatId = resp.chatId;
						this.openUserChat = true;
						this.currentChatSubscription = this.afs.collection('OnlineMeetups').doc(this.selectedMeetupDocData.id)
							.collection('chats').doc(resp.chatId).snapshotChanges().subscribe((chatDocument) => {
								this.currentChatDocument = chatDocument.payload.data();
								this.currentChatDocument.chatHeaderNames = this.currentChatDocument.userSnapshots.reduce((accumulatedStr, currentValue, currentIndex, array) => {
										if (this.loggedInUserDocData.uid !== currentValue.userId) {
											return (accumulatedStr === '' ? (accumulatedStr) : accumulatedStr + ',') + currentValue.displayName
										} else {
											return accumulatedStr;
										}
									}, ''
								)

								this.currentChatMessagesSubscription = this.afs.collection('OnlineMeetups').doc(this.selectedMeetupDocData.id)
									.collection('chats').doc(resp.chatId)
									.collection('messages', reference =>
										reference.orderBy('createdAt', 'asc')).snapshotChanges().subscribe((currentMessages) => {
										this.currentChatMessagesList = currentMessages.map((messageDocChangeAction) => {
											this.initScrollbar();
											let chatMessage = messageDocChangeAction.payload.doc.data();
											if (this.currentChatDocument && this.currentChatDocument.userSnapshots) {
												this.currentChatDocument.userSnapshots.forEach(function (userSnapshot) {
													if (chatMessage.senderUserId === userSnapshot.userId) {
														chatMessage.photoURL = userSnapshot.photoURL;
														chatMessage.displayName = userSnapshot.displayName;
													}
												});
											}
											this.ref.detectChanges();
											return chatMessage;
										});
									});
							});
					}
					this.trustedMembersCheckboxesArray.clear();
				}, err => {
					console.log('Error in calling createChat CF:' + err.message);
					this.trustedMembersCheckboxesArray.clear();
				});
		} catch (error) {
			console.log('Error in calling createChat CF:' + error.message);
			this.trustedMembersCheckboxesArray.clear();
		}
	}

	cancelClickedOnMemberSelectionPopup($event) {
		$event.preventDefault();
		this.trustedMembersCheckboxesArray.clear();
		this.showGroupBasedFiltering = false;
	}

	findClosest(el, sel) {
		while ((el = el.parentNode) && el.className.indexOf(sel) < 0) {
		}
		return el;
	}

	showFullDescription($event) {
		$event.stopPropagation();
		var hoverdElement = this.findClosest($event.target, 'chat-block-head'),
			imageElement = hoverdElement.querySelectorAll('.chat-block-photo')[0],
			top = imageElement.getBoundingClientRect().top + 45,
			bottom = imageElement.getBoundingClientRect().bottom,
			left = imageElement.getBoundingClientRect().left,
			element = hoverdElement.querySelectorAll('.chat-block-hover')[0];

		if (
			hoverdElement.getBoundingClientRect().bottom + 100 >=
			document.body.getBoundingClientRect().height
		) {
			var bottomValue =
				document.body.getBoundingClientRect().height - bottom + 55;
			element.style.bottom = bottomValue + 'px';

			element.style.left = left + 'px';
			element.style.top = 'auto';
		} else {
			element.style.bottom = 'auto';
			element.style.top = top + 'px';
			element.style.left = left + 'px';
		}

		setTimeout(() => {
			hoverdElement.classList.add('show-head-info');
		}, 800);
	}

	hideFullDescription($event) {
		$event.stopPropagation();
		let hoveredElement = this.findClosest($event.target, 'chat-block-head'),
			imageElement = hoveredElement.querySelectorAll('.chat-block-photo')[0];
		setTimeout(() => {
			if (!this.chatBlockHoverd) {
				hoveredElement.classList.remove('show-head-info');
			}
		}, 800);
	}

	chatBlockHover($event) {
		this.chatBlockHoverd = true;
	}

	hideChatBlock($event) {
		$event.stopPropagation();
		setTimeout(() => {
			if (this.chatBlockHoverd) {
				var hoverdElement = this.findClosest($event.target, 'chat-block-head');
				hoverdElement.classList.remove('show-head-info');
				this.chatBlockHoverd = false;
			} else {
			}
		}, 800);
	}

	moreOptionClick($event) {
		this.moreOptionPanel = !this.moreOptionPanel;
		this.ref.detectChanges();
	}

	initializeScrollbars(): Observable<PerfectScrollbar> {
		return of(new PerfectScrollbar('#chat-messages-opened-chat'));
	}

	ngAfterViewInit() {
	}

	initScrollbar() {
		this.initializeScrollbars()
			.pipe(
				take(1),
				delay(1500)
			)
			.subscribe(ps => ps.update());
	}

	openRecentChatInMainSection(recentChat): void {
		console.log('Opening...' + recentChat.chatId);
		this.openChatId = recentChat.chatId;
		this.openUserChat = true;
		this.currentChatSubscription = this.afs.collection('OnlineMeetups').doc(this.selectedMeetupDocData.id)
			.collection('chats').doc(recentChat.chatId).snapshotChanges().subscribe((chatDocument) => {
				this.currentChatDocument = chatDocument.payload.data();
				this.currentChatDocument.chatHeaderNames = this.currentChatDocument.userSnapshots.reduce((accumulatedStr, currentValue, currentIndex, array) => {
						if (this.loggedInUserDocData.uid !== currentValue.userId) {
							return (accumulatedStr === '' ? (accumulatedStr) : accumulatedStr + ',') + currentValue.displayName
						} else {
							return accumulatedStr;
						}
					}, ''
				);
				this.currentChatMessagesSubscription = this.afs.collection('OnlineMeetups').doc(this.selectedMeetupDocData.id)
					.collection('chats').doc(recentChat.chatId)
					.collection('messages', reference =>
						reference.orderBy('createdAt', 'asc')).snapshotChanges().subscribe((currentMessages) => {
						this.currentChatMessagesList = currentMessages.map((messageDocChangeAction) => {
							this.initScrollbar();
							let chatMessage = messageDocChangeAction.payload.doc.data();
							if (this.currentChatDocument && this.currentChatDocument.userSnapshots) {
								this.currentChatDocument.userSnapshots.forEach(function (userSnapshot) {
									if (chatMessage.senderUserId === userSnapshot.userId) {
										chatMessage.photoURL = userSnapshot.photoURL;
										chatMessage.displayName = userSnapshot.displayName;
									}
								});
							}
							this.ref.detectChanges();
							return chatMessage;
						});
					});
			});
	}

	openGroupChatInMainSection(group): void {
		if (this.loggedInUserDocData.isAnonymous || !this.meetupSubscriptionSnapshot.isTrusted) {
			this.toastrService.info('Group Chat cannot be accessed by Guest Users!', null, {closeButton: true});
			return;
		}
		console.log('Opening group chat for group:' + group.id);
		const callable = this.fns.httpsCallable(`createGroupChat`);
		this.showGroupBasedFiltering = false;
		try {
			let apiResponse = callable({
				groupId: group.id,
				meetupId: this.selectedMeetupDocData.id
			})
				.pipe(first())
				.subscribe(resp => {
					console.log({resp});
					if (resp.groupChatId) {
						this.openChatId = resp.groupChatId;
						this.openUserChat = true;
						this.currentChatSubscription = this.afs.collection('OnlineMeetups').doc(this.selectedMeetupDocData.id)
							.collection('chats').doc(resp.groupChatId).snapshotChanges().subscribe((chatDocument) => {
								this.currentChatDocument = chatDocument.payload.data();
								this.currentChatDocument.chatHeaderNames = group.name;

								this.currentChatMessagesSubscription = this.afs.collection('OnlineMeetups').doc(this.selectedMeetupDocData.id)
									.collection('chats').doc(resp.groupChatId)
									.collection('messages', reference =>
										reference.orderBy('createdAt', 'asc')).snapshotChanges().subscribe((currentMessages) => {
										this.currentChatMessagesList = currentMessages.map((messageDocChangeAction) => {
											this.initScrollbar();
											let chatMessage = messageDocChangeAction.payload.doc.data();
											if (this.currentChatDocument && this.currentChatDocument.groupChatUserSnapshots) {
												this.currentChatDocument.groupChatUserSnapshots.forEach(function (groupChatUserSnapshot) {
													if (chatMessage.senderUserId === groupChatUserSnapshot.userId) {
														chatMessage.photoURL = groupChatUserSnapshot.photoURL;
														chatMessage.displayName = groupChatUserSnapshot.displayName;
													}
												});
											}
											this.ref.detectChanges();
											return chatMessage;
										});
									});
							});
					}
				}, err => {
					console.log('Error in calling createGroupChat CF:' + err.message);
				});
		} catch (error) {
			console.log('Error in calling createGroupChat CF:' + error.message);
		}
	}

	getMemberOnlineStatus(recentChatItem): string {
		let trustedMemberRecordForChatter = this.trustedMembers?.find(member => member.userId === recentChatItem.userIds[0]);
		if (trustedMemberRecordForChatter) {
			return trustedMemberRecordForChatter.onlineStatus ? trustedMemberRecordForChatter.onlineStatus : "offline";
		} else {
			return "offline";
		}
	}

	ngOnDestroy(): void {
		this.loggedInUserFromAuthServiceSubscription.unsubscribe();

		if (this.currentChatSubscription) {
			this.currentChatSubscription.unsubscribe();
		}

		if (this.currentChatMessagesSubscription) {
			this.currentChatMessagesSubscription.unsubscribe();
		}
	}
}
