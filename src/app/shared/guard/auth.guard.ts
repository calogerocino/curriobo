import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, map, take } from 'rxjs';
import { AppState } from '../app.state';
import { User } from '../models/user.interface'; // Importa la tua interfaccia User
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
      take(1), // Prende l'ultimo valore emesso e completa, per evitare sottoscrizioni multiple
      map((user: User | null) => {
        const isAuthenticated = !!user; // L'utente è autenticato se l'oggetto user esiste

        if (!isAuthenticated) {
          // Se non autenticato, reindirizza alla pagina di login appropriata
          // Potresti voler reindirizzare a login-cliente se si tenta di accedere a /cliente
          // e a login (admin) se si tenta di accedere a /admin.
          // Per semplicità, qui reindirizziamo a /auth che poi gestirà il default.
          return this.router.createUrlTree(['/auth']);
        }

        // Utente autenticato, ora controlla i ruoli per le sezioni specifiche
        if (state.url.startsWith('/admin')) {
          if (user.ruolo === 'admin') {
            return true; // Accesso consentito all'area admin
          } else {
            console.warn(`Accesso negato a /admin per utente ${user.email} con ruolo: ${user.ruolo}`);
            this.store.dispatch(autologout()); // Esegui il logout
            // Reindirizza al login cliente o a una pagina di errore "accesso negato"
            return this.router.createUrlTree(['/auth/login-cliente'], { queryParams: { error: 'unauthorized_admin_area' } });
          }
        }

        if (state.url.startsWith('/cliente')) {
          if (user.ruolo === 'cliente') {
            return true; // Accesso consentito all'area cliente
          } else {
            console.warn(`Accesso negato a /cliente per utente ${user.email} con ruolo: ${user.ruolo}`);
            this.store.dispatch(autologout()); // Esegui il logout
            // Reindirizza al login admin o a una pagina di errore "accesso negato"
            return this.router.createUrlTree(['/auth/login'], { queryParams: { error: 'unauthorized_customer_area' } });
          }
        }

        // Se la rotta non è /admin o /cliente e l'utente è autenticato, permetti l'accesso
        // (es. una dashboard utente generica se esistesse, o altre rotte protette non specifiche per ruolo)
        return true;
      })
    );
  }
}
