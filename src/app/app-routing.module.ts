import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {SignInComponent} from './components/sign-in/sign-in.component';
import {SignUpComponent} from './components/sign-up/sign-up.component';
import {DashboardComponent} from './components/dashboard/dashboard.component';
import {ForgotPasswordComponent} from './components/forgot-password/forgot-password.component';
import {VerifyEmailComponent} from './components/verify-email/verify-email.component';

import {AuthGuard} from './shared/guard/auth.guard';
import {LoginGuard} from './shared/guard/login.guard';
import {FinishEmailSignInComponent} from './components/finish-email-sign-in/finish-email-sign-in.component';
import {EmailSignInComponent} from './components/email-sign-in/email-sign-in.component';

import {MeetingInviteComponent} from './components/dashboard/meetings/meeting-invite/meeting-invite.component';
import {NewMeetingsNowComponent} from './components/dashboard/meetings/new-meetings-now/new-meetings-now.component';
import {NewMeetingsGroupComponent} from './components/dashboard/meetings/new-meetings-group/new-meetings-group.component';
import {NewMeetingsScheduledComponent} from './components/dashboard/meetings/new-meetings-scheduled/new-meetings-scheduled.component';
import {MeetupSettingsComponent} from './components/dashboard/home/meetup-settings/meetup-settings.component';
import {AddMeetupsComponent} from './components/dashboard/home/add-meetups/add-meetups.component';
import {HomeComponent} from './components/dashboard/home/home.component';
import {MeetingNotifyComponent} from './components/dashboard/meetings/meeting-notify/meeting-notify.component';
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
import {JoinMeetupComponent} from './components/dashboard/home/join-meetup/join-meetup.component';
import {JoinPublicMeetupsComponent} from './components/dashboard/home/join-public-meetups/join-public-meetups.component';
import {MarketingPageComponent} from './components/marketing-page/marketing-page.component';
import {DashboardResolver} from './shared/guard/dashboard-resolver.service';
import {PublicMeetupsComponent} from './public-meetups/public-meetups.component';

const routes: Routes = [

    {path: '', component: HomePageComponent},
    {path: 'sign-up', component: SignUpComponent, canActivate: [AuthGuard]},
    {path: 'sign-in', component: SignInComponent, canActivate: [LoginGuard]},
    {path: 'be-a-part', component: BeAPartComponent, canActivate: [AuthGuard]},

    {
        path: 'email-sign-in',
        component: EmailSignInComponent,
        canActivate: [AuthGuard],
    },
    {
        path: 'finish-email-sign-in',
        component: FinishEmailSignInComponent,
        canActivate: [AuthGuard],
    },
    {
        path: 'guest/:id/form',
        component: GuestFormComponent,
        canActivate: [AuthGuard],
    },
    {
        path: 'joinmeeting/:id',
        component: JoinMeetingComponent,
    },

    {path: 'new-meetings-group', component: NewMeetingsGroupComponent},

    {path: 'new-meetings-scheduled', component: NewMeetingsScheduledComponent},
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
                component: AddMeetupsComponent,
            },
            {
                path: 'meetup/:id',
                component: HomeComponent,
            },
            {
                path: 'meetup/:id/join',
                component: JoinMeetupComponent,
            },
            {
                path: 'meetups/join',
                component: JoinPublicMeetupsComponent,
            },
            {
                path: 'meetups/settings',
                component: MeetupSettingsComponent,
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
                path: 'meeting/:id/notify',
                component: MeetingNotifyComponent,
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
