import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, exhaustMap, map, switchMap, tap, filter, take } from 'rxjs/operators';
import { AppState } from 'src/app/shared/app.state';
import { AuthResponseData } from 'src/app/shared/models/AuthResponseData';
import { User } from 'src/app/shared/models/user.interface';
import { AuthService } from 'src/app/shared/servizi/auth.service';
import { UserService } from 'src/app/shared/servizi/user.service';
import { setErrorMessage, setLoadingSpinner } from 'src/app/shared/store/shared.actions';
import {
  autoLogin,
  autologout,
  loginStart,
  loginSuccess,
  updateLogin,
  updateLoginSuccess,
  changePasswordStart,
  changePasswordSuccess,
  changeInfoStart,
  changeInfoSuccess
} from './auth.action';
import { getUser, getUserlocalId, getUserToken } from './auth.selector';
import Swal from 'sweetalert2';

@Injectable()
export class AuthEffects {
  private lastUrlKey = 'lastAuthenticatedUrl';

  constructor(
    private readonly actions$: Actions,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly store: Store<AppState>,
    private readonly userService: UserService
  ) {}

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loginStart),
      exhaustMap((action) => {
        // console.log('[AuthEffects login$] Action received:', JSON.parse(JSON.stringify(action)));
        return this.authService.SignIn(action.email, action.password).pipe(
          map((data: AuthResponseData) => {
            // console.log('[AuthEffects login$] SignIn success, data:', data);
            this.store.dispatch(setLoadingSpinner({ status: false }));
            this.store.dispatch(setErrorMessage({ message: null }));
            const user = this.authService.formatUser(data);
            // console.log('[AuthEffects login$] User formatted, before localStorage:', JSON.parse(JSON.stringify(user)));
            this.authService.setUserInLocalStorage(user); // Salva l'utente base, updateLogin lo arricchirà
            return loginSuccess({ user, redirect: action.redirect, isCustomerLogin: action.isCustomerLogin });
          }),
          catchError((errResp) => {
            console.error('[AuthEffects login$] SignIn error:', errResp);
            this.store.dispatch(setLoadingSpinner({ status: false }));
            const errorMessage = this.authService.getErrorMessage(
              errResp?.error?.error?.message || 'ERRORE_LOGIN_SCONOSCIUTO'
            );
            return of(setErrorMessage({ message: errorMessage }));
          })
        );
      })
    )
  );

  loginSuccessTriggerUpdateLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loginSuccess),
      // tap(action => console.log('[AuthEffects loginSuccessTriggerUpdateLogin$] loginSuccess action received. Props from action:', JSON.parse(JSON.stringify(action)))),
      map(action => {
        // console.log('[AuthEffects loginSuccessTriggerUpdateLogin$] Dispatching updateLogin() with redirect:', action.redirect, 'isCustomerLogin:', action.isCustomerLogin);
        return updateLogin({ redirect: action.redirect, isCustomerLogin: action.isCustomerLogin });
      })
    )
  );


  updateLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateLogin),
      // tap(action => console.log('[AuthEffects updateLogin$] Effect triggered by updateLogin. Props:', JSON.parse(JSON.stringify(action)))),
      concatLatestFrom(() => [
        this.store.select(getUserlocalId),
        this.store.select(getUser), // Prende l'utente dallo stato (potrebbe essere quello base da loginSuccess)
      ]),
      filter(([updateLoginAction, uid, userState]) => {
        const isValid = !!uid && !!userState && !!userState.token;
        if (!isValid) {
            console.error('[AuthEffects updateLogin$] UID o token utente mancanti nello stato DOPO loginSuccess. Impossibile chiamare MergeDatiUtente.');
        }
        return isValid;
      }),
      switchMap(([updateLoginAction, uid, userState]) => {
        // console.log(`[AuthEffects updateLogin$] UID from store (valid): ${uid}`);
        // console.log('[AuthEffects updateLogin$] User state from store (before merge, valid token):', userState ? JSON.parse(JSON.stringify(userState)) : null);
        // console.log(`[AuthEffects updateLogin$] Calling MergeDatiUtente with UID: ${uid}`);
        return this.userService.MergeDatiUtente(uid!, userState!).pipe( // Passa userState che contiene il token
          map((mergedUser: User) => {
            // console.log('[AuthEffects updateLogin$] MergeDatiUtente success, mergedUser:', JSON.parse(JSON.stringify(mergedUser)));
            this.authService.setUserInLocalStorage(mergedUser); // Aggiorna localStorage con l'utente completo (incluso il ruolo)
            return updateLoginSuccess({
              user: mergedUser,
              redirect: updateLoginAction.redirect,
              isCustomerLogin: updateLoginAction.isCustomerLogin
            });
          }),
          catchError(err => {
            console.error("[AuthEffects updateLogin$] Errore durante MergeDatiUtente:", err);
            // Qui l'utente è loggato in Auth, ma non abbiamo potuto caricare i dati da Firestore.
            // Potremmo dispatchare autologout o gestire diversamente.
            // Per ora, mandiamo un errore e l'utente rimane loggato con i dati base.
            this.store.dispatch(setErrorMessage({ message: 'Errore nell\'aggiornamento dei dati utente da Firestore.' }));
            // Considera di re-dispatchare updateLoginSuccess con userState (dati parziali) se vuoi che l'utente rimanga loggato
            // return of(updateLoginSuccess({ user: userState!, redirect: updateLoginAction.redirect, isCustomerLogin: updateLoginAction.isCustomerLogin }));
            // Oppure, se il ruolo è cruciale e non può essere determinato, fai logout:
            // return of(autologout());
            // Per ora, lasciamo che l'utente rimanga loggato con i dati parziali e mostriamo errore.
            // Se si opta per il logout, bisogna gestire il messaggio di errore in modo appropriato.
            // Ritornare un'azione di errore specifica per questo caso potrebbe essere meglio.
            return of(setErrorMessage({ message: 'Errore CRITICO nel recupero dei dati utente completi. Login parziale.' }));
          })
        );
      })
    )
  );

  loginRedirect$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(updateLoginSuccess), // Assicurati che questa azione contenga l'utente completo con il ruolo
        tap((action) => {
          // console.log('[AuthEffects loginRedirect$] updateLoginSuccess action received for redirect:', JSON.parse(JSON.stringify(action)));
          const user = action.user; // Questo utente dovrebbe avere il ruolo da Firestore
          const lastUrl = localStorage.getItem(this.lastUrlKey);

          if (action.redirect && user && user.ruolo) {
            let targetUrl: string | null = null;

            if (lastUrl && (lastUrl.startsWith('/admin/') || lastUrl.startsWith('/cliente/'))) {
              // Verifica se l'URL salvato è appropriato per il ruolo dell'utente
              if ((user.ruolo === 'admin' && lastUrl.startsWith('/admin/')) ||
                  (user.ruolo === 'cliente' && lastUrl.startsWith('/cliente/'))) {
                targetUrl = lastUrl;
                console.log(`[AuthEffects loginRedirect$] Attempting to redirect to saved URL: ${targetUrl}`);
              } else {
                console.warn(`[AuthEffects loginRedirect$] Saved URL ${lastUrl} not appropriate for user role ${user.ruolo}. Ignoring.`);
              }
              localStorage.removeItem(this.lastUrlKey); // Rimuovi sempre dopo averlo letto per il redirect corrente
            }

            if (targetUrl) {
              this.router.navigateByUrl(targetUrl).catch(err => {
                console.error(`[AuthEffects loginRedirect$] Error navigating to ${targetUrl}, falling back to role-based default. Error:`, err);
                this.redirectToRoleDefault(user);
              });
            } else {
              this.redirectToRoleDefault(user);
            }

          } else if (action.redirect && user && !user.ruolo) {
              console.warn(`[AuthEffects loginRedirect$] Utente ${user.email} non ha un ruolo definito in Firestore. Redirecting to login.`);
              this.store.dispatch(autologout());
              this.router.navigate(['/auth/login'], { queryParams: { error: 'missing_role' } });
          } else if (!action.redirect) {
              // console.log('[AuthEffects loginRedirect$] No redirect needed based on action.redirect flag.');
          } else if (action.redirect && !user) {
              console.warn('[AuthEffects loginRedirect$] Tentativo di redirect ma user è null. Redirecting to login.');
              this.router.navigate(['/auth/login'], { queryParams: { error: 'login_failed_no_user' } });
          }
        })
      );
    },
    { dispatch: false }
  );

  private redirectToRoleDefault(user: User): void {
    if (user.ruolo === 'cliente') {
      // console.log('[AuthEffects loginRedirect$] Navigating to /cliente/account (default)');
      this.router.navigate(['/customer/customer-dashboard']);
    } else if (user.ruolo === 'admin') {
      // console.log('[AuthEffects loginRedirect$] Navigating to /admin/dashboard (default)');
      this.router.navigate(['/admin/dashboard']); // Pagina di default per admin
    } else {
      // Questo caso dovrebbe essere già gestito dalla logica precedente, ma per sicurezza:
      console.warn(`[AuthEffects loginRedirect$] Utente ${user.email} ha un ruolo sconosciuto o indefinito: ${user.ruolo}. Redirecting to login.`);
      this.store.dispatch(autologout());
      this.router.navigate(['/auth/login'], { queryParams: { error: 'unknown_role_default_redirect' } });
    }
  }


  autoLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(autoLogin),
      map(() => {
        const userFromStorage = this.authService.getUserFromLocalStorage();
        // console.log('[AuthEffects autoLogin$] User from localStorage:', userFromStorage ? JSON.parse(JSON.stringify(userFromStorage)) : null);
        if (userFromStorage && userFromStorage.expirationDate && new Date(userFromStorage.expirationDate) > new Date()) {
          // Non avviare il runTimeoutInterval qui se setUserInLocalStorage in updateLogin lo fa già
          // this.authService.runTimeoutInterval(userFromStorage);
          // console.log('[AuthEffects autoLogin$] Dispatching loginSuccess for autoLogin. User role from storage:', userFromStorage.ruolo);
          return loginSuccess({ // loginSuccess triggererà updateLogin -> updateLoginSuccess -> loginRedirect$
            user: userFromStorage,
            redirect: true, // Importante per triggerare la catena di redirect che include il check del lastUrl
            isCustomerLogin: userFromStorage.ruolo === 'cliente'
          });
        }
        // console.log('[AuthEffects autoLogin$] No valid user found in localStorage or token expired.');
        return { type: '[Auth] AutoLogin No User Found or Token Expired' }; // Azione che non fa nulla o logga
      })
    )
  );

  logout$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(autologout),
        tap(() => {
          this.authService.logoutS(); // Questo dovrebbe già pulire i dati utente dal localStorage
          localStorage.removeItem(this.lastUrlKey); // Rimuovi esplicitamente l'URL salvato al logout
          console.log('[AuthEffects logout$] Last authenticated URL removed from localStorage.');
          this.router.navigate(['/']); // Reindirizza alla landing page
        })
      );
    },
    { dispatch: false }
  );

  changePassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(changePasswordStart),
      switchMap((action) => {
        return this.authService.ChangePassword(action.idToken, action.password).pipe(
          map((data) => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            this.store.dispatch(setErrorMessage({ message: null }));
            // Potresti voler mostrare un messaggio di successo con Swal
            Swal.fire('Successo', 'Password aggiornata con successo!', 'success');
            return changePasswordSuccess();
          }),
          catchError((errResp) => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            const ErrorMessage = this.authService.getErrorMessage(
              errResp.error.error.message
            );
            // Mostra errore con Swal
            Swal.fire('Errore', ErrorMessage, 'error');
            return of(setErrorMessage({ message: ErrorMessage }));
          })
        );
      })
    )
  );

  changeInfo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(changeInfoStart),
      switchMap((action) => {
        return this.store.select(getUserToken).pipe( // getUserToken qui
          take(1), // take qui
          switchMap(token => {
            let authUpdateObservable = of(null);

            if (action.value.displayName !== undefined && token) {
              const displayName = action.value.displayName!;
              // Assicurati che photoURL sia una stringa, anche vuota se non definita.
              const photoURLFromStorage = this.authService.getUserFromLocalStorage()?.photoURL;
              const photoURLValue = action.value.photoURL || photoURLFromStorage || ''; // Correzione qui
              authUpdateObservable = this.authService.ChangeInfo(token, displayName, photoURLValue);
            }

            return authUpdateObservable.pipe(
              switchMap(() => {
                return this.userService.updateUserInfo(action.localId, action.value).pipe(
                  map(() => {
                    this.store.dispatch(setLoadingSpinner({ status: false }));
                    this.store.dispatch(setErrorMessage({ message: null }));
                    this.store.dispatch(updateLogin({ redirect: false, isCustomerLogin: action.value.ruolo === 'cliente' }));
                    Swal.fire('Successo', 'Profilo aggiornato con successo!', 'success'); // Swal qui
                    return changeInfoSuccess();
                  })
                );
              }),
              catchError(errResp => {
                this.store.dispatch(setLoadingSpinner({ status: false }));
                console.error("Errore aggiornamento profilo:", errResp);
                const errorMessage = this.authService.getErrorMessage(
                  errResp?.error?.error?.message || 'ERRORE_AGGIORNAMENTO_PROFILO'
                );
                Swal.fire('Errore', errorMessage, 'error'); // Swal qui
                return of(setErrorMessage({ message: errorMessage }));
              })
            );
          })
        );
      })
    )
  );
}
