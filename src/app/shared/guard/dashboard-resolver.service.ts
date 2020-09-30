import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
@Injectable()
export class DashboardResolver implements Resolve<any> {

  
  constructor(private authService: AuthService) { console.log('In the resolver'); }

  resolve(): Observable<any> {
    return this.authService.loggedInUserFromAuthService$.pipe(
      switchMap(user => {
        if (user) {
          console.log("User");
          return of(user);
        } else {
          return of(null);
        }
      })
  );
  }
}
