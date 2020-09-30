import {Injectable} from '@angular/core';
import {CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, ActivatedRoute} from '@angular/router';
import {AuthService} from '../services/auth.service';
import {Observable} from 'rxjs';

@Injectable({
	providedIn: 'root'
})

export class LoginGuard implements CanActivate {

	constructor(
		public authService: AuthService,
		public router: Router,
		private route: ActivatedRoute
	) {
	}

	canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
		return new Promise((resolve, reject) => {
			this.authService.loggedInUserFromAuthService$.subscribe((firebaseUser) => {
				if (!firebaseUser) {
					console.log('login guard not logged-in');
					return resolve(true);
				} else {
					if (this.route.snapshot.queryParams['returnUrl']) {
						console.log('returnUrl---->' + this.route.snapshot.queryParams['returnUrl']);
						this.router.navigateByUrl(this.route.snapshot.queryParams['returnUrl']);
					} else {
						console.log('Sending to dashboard...' + this.route.snapshot.queryParams['returnUrl']);
						this.router.navigate(['/dashboard'])
					}
				}
			});
		});
	}
}
