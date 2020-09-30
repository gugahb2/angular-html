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
        return this.authService.firebaseUser$.pipe(
            take(1),
            map(user => !!user),
            tap(loggedIn => {
              if (!loggedIn) {
                console.log('Auth Guard Not logged in');
                this.router.navigate(['/sign-in'], { queryParams: { returnUrl: state.url }});
              }
          })
        );
      }
}
