import { Component, OnInit } from '@angular/core';
import {AuthService} from '../../shared/services/auth.service';
import {ApiService} from '../../shared/services/api.service';

@Component({
  selector: 'app-meeting-notify',
  templateUrl: './meeting-notify.component.html',
  styleUrls: ['./meeting-notify.component.scss']
})
export class MeetingNotifyComponent implements OnInit {

  constructor(
    public authService: AuthService,
    public apiService: ApiService
  ) { }

  ngOnInit(): void {
  }

}
