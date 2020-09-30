import {Injectable} from '@angular/core';
import {CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router} from '@angular/router';
import {AuthService} from '../services/auth.service';
import {Observable} from 'rxjs';
import { take, map, tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})

export class AuthGuard implements CanActivate {

    constructor(
        private authService: AuthService,
        private router: Router,
    ) {
    }

    canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.authService.loggedInUserFromAuthService$.pipe(
            take(1),
            map(user => !!user),
            tap(loggedIn => {
              if (!loggedIn) {
                console.log('Auth Guard Not logged in');
                  let queryParamsObject = {};
                  if(next?.queryParams?.frompm){
                      queryParamsObject['frompm'] = next.queryParams.frompm;
                  }
                  if(next?.queryParams?.mid){
                      queryParamsObject['mid'] = next.queryParams.mid;
                  }
                  queryParamsObject['returnUrl'] = state.url;
                this.router.navigate(['/sign-in'], { queryParams: queryParamsObject});
              } else {
                  this.authService.loggedInUserFromAuthService$.subscribe((firebaseUser => {
                      if (firebaseUser){
                          //console.log('firebaseUser in auth guard:' + JSON.stringify(firebaseUser))
                      }
                  }))
              }
          })
        );
      }
}
