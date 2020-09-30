import { Component, OnInit } from '@angular/core';
import {AuthService} from '../../shared/services/auth.service';

@Component({
  selector: 'app-email-sign-in',
  templateUrl: './email-sign-in.component.html',
  styleUrls: ['./email-sign-in.component.scss']
})
export class EmailSignInComponent implements OnInit {

  constructor(
      public authService: AuthService
  ) { }

  ngOnInit(): void {
  }

}
