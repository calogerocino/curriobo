import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, map, take } from 'rxjs';
import { AppState } from '../app.state';
import { User } from '../models/user.interface';
import { autologout } from 'src/app/views/auth/state/auth.action';
import { getUser } from 'src/app/views/auth/state/auth.selector';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private readonly store: Store<AppState>, private readonly router: Router) {}

   canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.store.select(getUser).pipe(
      take(1),
      map((user: User | null) => {
        const isAuthenticated = !!user;

        if (!isAuthenticated) {
          return this.router.createUrlTree(['/auth']);
        }

        if (state.url.startsWith('/admin')) {
          if (user.ruolo === 'admin') {
            return true;
          } else {
            console.warn(`Accesso negato a /admin per utente ${user.email} con ruolo: ${user.ruolo}`);
            this.store.dispatch(autologout());
            return this.router.createUrlTree(['/auth/login-cliente'], { queryParams: { error: 'unauthorized_admin_area' } });
          }
        }

        if (state.url.startsWith('/cliente')) {
          if (user.ruolo === 'cliente') {
            return true;
          } else {
            console.warn(`Accesso negato a /cliente per utente ${user.email} con ruolo: ${user.ruolo}`);
            this.store.dispatch(autologout());
            return this.router.createUrlTree(['/auth/login'], { queryParams: { error: 'unauthorized_customer_area' } });
          }
        }

        return true;
      })
    );
  }
}
