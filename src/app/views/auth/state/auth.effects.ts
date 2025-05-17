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
        return this.authService.SignIn(action.email, action.password).pipe(
          map((data: AuthResponseData) => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            this.store.dispatch(setErrorMessage({ message: null }));
            const user = this.authService.formatUser(data);
            this.authService.setUserInLocalStorage(user);
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
      map(action => {
        return updateLogin({ redirect: action.redirect, isCustomerLogin: action.isCustomerLogin });
      })
    )
  );


  updateLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateLogin),
      concatLatestFrom(() => [
        this.store.select(getUserlocalId),
        this.store.select(getUser),
      ]),
      filter(([updateLoginAction, uid, userState]) => {
        const isValid = !!uid && !!userState && !!userState.token;
        if (!isValid) {
            console.error('[AuthEffects updateLogin$] UID o token utente mancanti nello stato DOPO loginSuccess. Impossibile chiamare MergeDatiUtente.');
        }
        return isValid;
      }),
      switchMap(([updateLoginAction, uid, userState]) => {
        return this.userService.MergeDatiUtente(uid!, userState!).pipe(
          map((mergedUser: User) => {
            this.authService.setUserInLocalStorage(mergedUser);
            return updateLoginSuccess({
              user: mergedUser,
              redirect: updateLoginAction.redirect,
              isCustomerLogin: updateLoginAction.isCustomerLogin
            });
          }),
          catchError(err => {
            console.error("[AuthEffects updateLogin$] Errore durante MergeDatiUtente:", err);
            this.store.dispatch(setErrorMessage({ message: 'Errore nell\'aggiornamento dei dati utente da Firestore.' }));
            return of(setErrorMessage({ message: 'Errore CRITICO nel recupero dei dati utente completi. Login parziale.' }));
          })
        );
      })
    )
  );

  loginRedirect$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(updateLoginSuccess),
        tap((action) => {
          const user = action.user;
          const lastUrl = localStorage.getItem(this.lastUrlKey);

          if (action.redirect && user && user.ruolo) {
            let targetUrl: string | null = null;

            if (lastUrl && (lastUrl.startsWith('/admin/') || lastUrl.startsWith('/cliente/'))) {
              if ((user.ruolo === 'admin' && lastUrl.startsWith('/admin/')) ||
                  (user.ruolo === 'cliente' && lastUrl.startsWith('/cliente/'))) {
                targetUrl = lastUrl;
              }
              localStorage.removeItem(this.lastUrlKey);
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
          }
        })
      );
    },
    { dispatch: false }
  );

private redirectToRoleDefault(user: User): void {
    if (user.ruolo === 'cliente') {
      this.router.navigate(['/cliente/dashboard']);
    } else if (user.ruolo === 'admin') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      console.warn(`[AuthEffects redirectToRoleDefault] Utente ${user.email} ha un ruolo sconosciuto o indefinito: ${user.ruolo}. Redirecting to login.`);
      this.store.dispatch(autologout());
      this.router.navigate(['/auth/login'], { queryParams: { error: 'unknown_role_default_redirect' } });
    }
  }


  autoLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(autoLogin),
      map(() => {
        const userFromStorage = this.authService.getUserFromLocalStorage();
        if (userFromStorage && userFromStorage.expirationDate && new Date(userFromStorage.expirationDate) > new Date()) {
          return loginSuccess({
            user: userFromStorage,
            redirect: true,
            isCustomerLogin: userFromStorage.ruolo === 'cliente'
          });
        }
        return { type: '[Auth] AutoLogin No User Found or Token Expired' };
      })
    )
  );

  logout$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(autologout),
        tap(() => {
          this.authService.logoutS();
          localStorage.removeItem(this.lastUrlKey);
          console.log('[AuthEffects logout$] Last authenticated URL removed from localStorage.');
          this.router.navigate(['/']);
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
            Swal.fire('Successo', 'Password aggiornata con successo!', 'success');
            return changePasswordSuccess();
          }),
          catchError((errResp) => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            const ErrorMessage = this.authService.getErrorMessage(
              errResp.error.error.message
            );
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
        return this.store.select(getUserToken).pipe(
          take(1),
          switchMap(token => {
            let authUpdateObservable = of(null);

            if (action.value.displayName !== undefined && token) {
              const displayName = action.value.displayName!;
              const photoURLFromStorage = this.authService.getUserFromLocalStorage()?.photoURL;
              const photoURLValue = action.value.photoURL || photoURLFromStorage || '';
              authUpdateObservable = this.authService.ChangeInfo(token, displayName, photoURLValue);
            }

            return authUpdateObservable.pipe(
              switchMap(() => {
                return this.userService.updateUserInfo(action.localId, action.value).pipe(
                  map(() => {
                    this.store.dispatch(setLoadingSpinner({ status: false }));
                    this.store.dispatch(setErrorMessage({ message: null }));
                    this.store.dispatch(updateLogin({ redirect: false, isCustomerLogin: action.value.ruolo === 'cliente' }));
                    Swal.fire('Successo', 'Profilo aggiornato con successo!', 'success');
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
                Swal.fire('Errore', errorMessage, 'error'); 
                return of(setErrorMessage({ message: errorMessage }));
              })
            );
          })
        );
      })
    )
  );
}
