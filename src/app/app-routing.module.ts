import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {SignInComponent} from './components/sign-in/sign-in.component';
import {SignUpComponent} from './components/sign-up/sign-up.component';
import {DashboardComponent} from './components/dashboard/dashboard.component';

import {AuthGuard} from './shared/guard/auth.guard';
import {LoginGuard} from './shared/guard/login.guard';
import {FinishEmailSignInComponent} from './components/finish-email-sign-in/finish-email-sign-in.component';
import {EmailSignInComponent} from './components/email-sign-in/email-sign-in.component';

import {MeetingInviteComponent} from './components/dashboard/meetings/meeting-invite/meeting-invite.component';
import {NewMeetingsNowComponent} from './components/dashboard/meetings/new-meetings-now/new-meetings-now.component';
import {AddNewMeetup} from './components/dashboard/home/add-new-meetup/add-new-meetup.component';
import {LoadMeetupsOnAppLoad} from './components/dashboard/home/load-meetups-on-app-load/load-meetups-on-app-load.component';
import {HomeComponent} from './components/dashboard/home/home.component';
import {ChatComponent} from './components/dashboard/chat/chat.component';
import {MeetingsComponent} from './components/dashboard/meetings/meetings.component';
import {GroupsComponent} from './components/dashboard/groups/groups.component';
import {MoreComponent} from './components/dashboard/more/more.component';
import {NewGroupComponent} from './components/dashboard/groups/new-group/new-group.component';
import {GroupInviteComponent} from './components/dashboard/groups/group-invite/group-invite.component';
import {BeAPartComponent} from './components/be-a-part/be-a-part.component';
import {GuestLoginComponent} from './components/guest-login/guest-login.component';
import {PageNotFoundComponent} from './components/page-not-found/page-not-found.component';
import {GuestFormComponent} from './components/guest-form/guest-form.component';
import {JoinMeetingComponent} from './components/join-meeting/join-meeting.component';
import {HomePageComponent} from './components/home-page/home-page.component';
import {JoinPublicMeetupsComponent} from './components/dashboard/home/join-public-meetups/join-public-meetups.component';
import {MarketingPageComponent} from './components/marketing-page/marketing-page.component';
import {DashboardResolver} from './shared/guard/dashboard-resolver.service';
import {PublicMeetupsComponent} from './components/public-meetups/public-meetups.component';
import {PendingMemberReviewComponent} from "./components/pending-member-review/pending-member-review.component";
import {PrivacyPolicyComponent} from "./components/privacy-policy/privacy-policy.component";
import {OmSettingsComponent} from "./components/dashboard/om-settings/om-settings.component";

const routes: Routes = [

	{path: '', component: HomePageComponent},
	{path: 'sign-up', component: SignUpComponent, canActivate: []},
	{path: 'sign-in', component: SignInComponent, canActivate: []},
	{path: 'be-a-part', component: BeAPartComponent, canActivate: [AuthGuard]},
	{
		path: 'email-sign-in',
		component: EmailSignInComponent,
		canActivate: [],
	},
	{
		path: 'finish-email-sign-in',
		component: FinishEmailSignInComponent,
		canActivate: [],
	},
	{
		path: 'guest/:id/form',
		component: GuestFormComponent,
		canActivate: [],
	},
	{
		path: 'joinmeeting/:id',
		component: JoinMeetingComponent,
	},
	{
		path: 'dashboard',
		component: DashboardComponent,
		canActivate: [AuthGuard],
		children: [
			{
				path: '',
				pathMatch: 'full',
				redirectTo: 'meetups',
			},
			{
				path: 'meetups',
				component: LoadMeetupsOnAppLoad,
			},
			{
				path: 'meetup/:id',
				component: HomeComponent,
			},
			{
				path: 'meetups/:id/join',
				component: JoinPublicMeetupsComponent,
			},
			{
				path: 'meetup/:id/memberreview',
				component: PendingMemberReviewComponent,
			},
			{
				path: 'add-new-meetup',
				component: AddNewMeetup,
			},
			{
				path: 'om-settings',
				component: OmSettingsComponent,
			},
			{
				path: 'chat',
				component: ChatComponent,
			},
			{
				path: 'meetings',
				component: MeetingsComponent,
			},
			{
				path: 'meetings/new',
				component: NewMeetingsNowComponent,
			},
			{
				path: 'meeting/:id/invite',
				component: MeetingInviteComponent,
			},
			{
				path: 'groups',
				component: GroupsComponent,
			},
			{
				path: 'groups/new',
				component: NewGroupComponent,
			},
			{
				path: 'groups/invite',
				component: GroupInviteComponent,
			},
			{
				path: 'more',
				component: MoreComponent,
			},
		],
	},
	{
		path: 'publicmeetups',
		component: PublicMeetupsComponent,
	},
	{
		path: 'privacy-policy',
		component: PrivacyPolicyComponent,
	},
	{
		path: '**',
		component: PageNotFoundComponent,
	},
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule],
})
export class AppRoutingModule {
}
