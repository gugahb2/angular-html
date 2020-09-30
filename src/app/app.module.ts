import { CommonModule } from '@angular/common';
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { NgModule } from "@angular/core";
import { HttpClientModule } from "@angular/common/http";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";

import { AngularFireModule } from "@angular/fire";
import { AngularFireAuthModule } from "@angular/fire/auth";
import { AngularFirestoreModule } from "@angular/fire/firestore";
import { environment } from "../environments/environment";
import { DashboardComponent } from "./components/dashboard/dashboard.component";
import { SignInComponent } from "./components/sign-in/sign-in.component";
import { SignUpComponent } from "./components/sign-up/sign-up.component";

import { AuthService } from "./shared/services/auth.service";
import { ProfileComponent } from "./components/profile/profile.component";
import { ClarityModule } from "@clr/angular";
import { FinishEmailSignInComponent } from "./components/finish-email-sign-in/finish-email-sign-in.component";
import { EmailSignInComponent } from "./components/email-sign-in/email-sign-in.component";
import { ApiService } from "./shared/services/api.service";

import { AngularFireFunctionsModule, REGION } from "@angular/fire/functions";
import { NewMeetingsNowComponent } from "./components/dashboard/meetings/new-meetings-now/new-meetings-now.component";
import { AddNewMeetup } from "./components/dashboard/home/add-new-meetup/add-new-meetup.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HomeComponent } from "./components/dashboard/home/home.component";
import { LoadMeetupsOnAppLoad } from "./components/dashboard/home/load-meetups-on-app-load/load-meetups-on-app-load.component";
import { ChatComponent } from "./components/dashboard/chat/chat.component";
import { MeetingsComponent } from "./components/dashboard/meetings/meetings.component";
import { MeetingInviteComponent } from "./components/dashboard/meetings/meeting-invite/meeting-invite.component";
import { NavigationComponent } from "./components/dashboard/navigation/navigation.component";
import { GroupsComponent } from "./components/dashboard/groups/groups.component";
import { MoreComponent } from "./components/dashboard/more/more.component";

import { PerfectScrollbarModule } from "ngx-perfect-scrollbar";
import { PERFECT_SCROLLBAR_CONFIG } from "ngx-perfect-scrollbar";
import { PerfectScrollbarConfigInterface } from "ngx-perfect-scrollbar";
import { NewGroupComponent } from "./components/dashboard/groups/new-group/new-group.component";
import { GroupInviteComponent } from "./components/dashboard/groups/group-invite/group-invite.component";

import { LineTruncationLibModule } from "ngx-line-truncation";
import { NewChatComponent } from "./components/dashboard/chat/new-chat/new-chat.component";
import { BeAPartComponent } from "./components/be-a-part/be-a-part.component";
import { GuestLoginComponent } from "./components/guest-login/guest-login.component";
import { PageNotFoundComponent } from "./components/page-not-found/page-not-found.component";
import { GuestFormComponent } from "./components/guest-form/guest-form.component";
import { JoinMeetingComponent } from "./components/join-meeting/join-meeting.component";
import { HomePageComponent } from "./components/home-page/home-page.component";
import { ToastrModule } from "ngx-toastr";
import { JoinPublicMeetupsComponent } from './components/dashboard/home/join-public-meetups/join-public-meetups.component';
import { PublicMeetupsComponent } from './components/public-meetups/public-meetups.component';
import { MarketingPageComponent } from './components/marketing-page/marketing-page.component';
import { DashboardResolver } from './shared/guard/dashboard-resolver.service';
import { PendingMemberReviewComponent } from './components/pending-member-review/pending-member-review.component';
import { NgInitDirective } from './shared/directives/ng-init.directive';
import {PresenceService} from "./shared/services/presence.service";
import {EllipsisModule} from "ngx-ellipsis";
import { ReadMoreComponent } from './components/read-more/read-more.component';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';
import { OmSettingsComponent } from './components/dashboard/om-settings/om-settings.component';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
	suppressScrollX: true,
};

@NgModule({
	declarations: [
		AppComponent,
		DashboardComponent,
		SignInComponent,
		SignUpComponent,
		ProfileComponent,
		FinishEmailSignInComponent,
		EmailSignInComponent,
		NewMeetingsNowComponent,
		AddNewMeetup,
		HomeComponent,
		LoadMeetupsOnAppLoad,
		AddNewMeetup,
		ChatComponent,
		MeetingsComponent,
		NavigationComponent,
		GroupsComponent,
		MoreComponent,
		MeetingInviteComponent,
		NavigationComponent,
		NewGroupComponent,
		GroupInviteComponent,
		NewChatComponent,
		BeAPartComponent,
		GuestLoginComponent,
		PageNotFoundComponent,
		GuestFormComponent,
		JoinMeetingComponent,
		HomePageComponent,
		JoinPublicMeetupsComponent,
		PublicMeetupsComponent,
		MarketingPageComponent,
		PendingMemberReviewComponent,
		NgInitDirective,
		ReadMoreComponent,
		PrivacyPolicyComponent,
		OmSettingsComponent,
	],
	imports: [
		CommonModule,
		BrowserModule,
		BrowserAnimationsModule,
		AppRoutingModule,
		AngularFireModule.initializeApp(environment.firebase),
		AngularFireAuthModule,
		AngularFirestoreModule,
		ClarityModule,
		BrowserAnimationsModule,
		HttpClientModule,
		FormsModule,
		ReactiveFormsModule,
		PerfectScrollbarModule,
		LineTruncationLibModule,
		ToastrModule.forRoot(),
		EllipsisModule
	],
	providers: [
		AuthService,
		ApiService,
		{ provide: REGION, useValue: "us-central1" },
		{
			provide: PERFECT_SCROLLBAR_CONFIG,
			useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG,
		},
		DashboardResolver,
		PresenceService
	],
	bootstrap: [AppComponent],
	exports: [NgInitDirective]
})
export class AppModule {}
