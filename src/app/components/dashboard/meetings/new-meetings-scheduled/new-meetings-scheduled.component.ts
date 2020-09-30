import { Component, OnInit } from '@angular/core';
import {AuthService} from '../../../../shared/services/auth.service';
import {ApiService} from '../../../../shared/services/api.service';
@Component({
  selector: 'app-new-meetings-scheduled',
  templateUrl: './new-meetings-scheduled.component.html',
  styleUrls: ['./new-meetings-scheduled.component.scss']
})
export class NewMeetingsScheduledComponent implements OnInit {

  constructor(
    public authService: AuthService,
    public apiService: ApiService
  ) { }

  ngOnInit(): void {
  }

}
