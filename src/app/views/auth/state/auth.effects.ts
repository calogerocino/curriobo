// src/app/views/auth/state/auth.effects.ts
import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, exhaustMap, map, switchMap, tap, filter } from 'rxjs/operators'; // Aggiunto filter
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
import { getUser, getUserlocalId } from './auth.selector';


@Injectable()
export class AuthEffects {
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
        console.log('[AuthEffects login$] Action received:', JSON.parse(JSON.stringify(action)));
        return this.authService.SignIn(action.email, action.password).pipe(
          map((data: AuthResponseData) => {
            console.log('[AuthEffects login$] SignIn success, data:', data);
            this.store.dispatch(setLoadingSpinner({ status: false }));
            this.store.dispatch(setErrorMessage({ message: null }));
            const user = this.authService.formatUser(data);
            console.log('[AuthEffects login$] User formatted, before localStorage:', JSON.parse(JSON.stringify(user)));
            this.authService.setUserInLocalStorage(user);
            // Dispatch loginSuccess per aggiornare lo store con i dati base.
            // Il redirect è false qui, perché il redirect effettivo avverrà dopo updateLoginSuccess.
            // L'intento di redirect originale (action.redirect) e isCustomerLogin vengono passati.
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

  // Nuovo effetto che ascolta loginSuccess e poi dispatcha updateLogin
  loginSuccessTriggerUpdateLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loginSuccess),
      tap(action => console.log('[AuthEffects loginSuccessTriggerUpdateLogin$] loginSuccess action received. Props from action:', JSON.parse(JSON.stringify(action)))),
      map(action => {
        // Dispatcha updateLogin, passando i flag redirect e isCustomerLogin dall'azione loginSuccess
        console.log('[AuthEffects loginSuccessTriggerUpdateLogin$] Dispatching updateLogin() with redirect:', action.redirect, 'isCustomerLogin:', action.isCustomerLogin);
        return updateLogin({ redirect: action.redirect, isCustomerLogin: action.isCustomerLogin });
      })
    )
  );


  updateLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateLogin),
      tap(action => console.log('[AuthEffects updateLogin$] Effect triggered by updateLogin. Props:', JSON.parse(JSON.stringify(action)))),
      concatLatestFrom(() => [ // Usa concatLatestFrom per assicurarti che lo store sia aggiornato da loginSuccess
        this.store.select(getUserlocalId),
        this.store.select(getUser),
      ]),
      filter(([updateLoginAction, uid, userState]) => { // Aggiunto filter per procedere solo se uid e token sono validi
        const isValid = !!uid && !!userState && !!userState.token;
        if (!isValid) {
            console.error('[AuthEffects updateLogin$] UID o token utente mancanti nello stato DOPO loginSuccess. Impossibile chiamare MergeDatiUtente.');
        }
        return isValid;
      }),
      switchMap(([updateLoginAction, uid, userState]) => {
        console.log(`[AuthEffects updateLogin$] UID from store (valid): ${uid}`);
        console.log('[AuthEffects updateLogin$] User state from store (before merge, valid token):', userState ? JSON.parse(JSON.stringify(userState)) : null);
        console.log(`[AuthEffects updateLogin$] Calling MergeDatiUtente with UID: ${uid}`);
        return this.userService.MergeDatiUtente(uid!, userState!).pipe( // Aggiunto '!' perché il filter garantisce che non siano null
          map((mergedUser: User) => {
            console.log('[AuthEffects updateLogin$] MergeDatiUtente success, mergedUser:', JSON.parse(JSON.stringify(mergedUser)));
            this.authService.setUserInLocalStorage(mergedUser);
            return updateLoginSuccess({
              user: mergedUser,
              redirect: updateLoginAction.redirect, // Propaga il flag redirect
              isCustomerLogin: updateLoginAction.isCustomerLogin // Propaga il flag isCustomerLogin
            });
          }),
          catchError(err => {
            console.error("[AuthEffects updateLogin$] Errore durante MergeDatiUtente:", err);
            return of(setErrorMessage({ message: 'Errore nell\'aggiornamento dei dati utente da Firestore.' }));
          })
        );
      })
    )
  );

  loginRedirect$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(updateLoginSuccess), // Ora ascolta SOLO updateLoginSuccess
        // Non è più necessario concatLatestFrom qui se l'azione updateLoginSuccess contiene già l'utente completo
        tap((action) => { // action è updateLoginSuccess e contiene l'utente completo e i flag
          console.log('[AuthEffects loginRedirect$] updateLoginSuccess action received:', JSON.parse(JSON.stringify(action)));
          const user = action.user; // L'utente completo è nell'azione

          if (action.redirect && user) {
            console.log('[AuthEffects loginRedirect$] Evaluating redirect. isCustomerLogin:', action.isCustomerLogin, 'User role:', user.ruolo);
            if (action.isCustomerLogin) {
              if (user.ruolo === 'cliente') {
                console.log('[AuthEffects loginRedirect$] Navigating to /cliente/account');
                this.router.navigate(['/cliente/account']);
              } else {
                console.warn(`[AuthEffects loginRedirect$] Tentativo di login cliente fallito: utente ${user.email} non ha ruolo cliente. Ruolo trovato: ${user.ruolo}`);
                this.store.dispatch(autologout());
                this.router.navigate(['/auth/login-cliente'], { queryParams: { error: 'unauthorized_role' } });
              }
            } else { // Admin login
              if (user.ruolo === 'admin') {
                console.log('[AuthEffects loginRedirect$] Navigating to /admin');
                this.router.navigate(['/admin']);
              } else {
                 console.warn(`[AuthEffects loginRedirect$] Tentativo di login admin fallito: utente ${user.email} non ha ruolo admin. Ruolo trovato: ${user.ruolo}`);
                this.store.dispatch(autologout());
                this.router.navigate(['/auth/login'], { queryParams: { error: 'unauthorized_role' } });
              }
            }
          } else {
            console.log('[AuthEffects loginRedirect$] No redirect needed or user is null. Redirect flag:', action.redirect, 'User:', user);
          }
        })
      );
    },
    { dispatch: false }
  );


  autoLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(autoLogin),
      map(() => {
        const userFromStorage = this.authService.getUserFromLocalStorage();
        console.log('[AuthEffects autoLogin$] User from localStorage:', userFromStorage ? JSON.parse(JSON.stringify(userFromStorage)) : null);
        if (userFromStorage && userFromStorage.expirationDate && new Date(userFromStorage.expirationDate) > new Date()) {
          this.authService.runTimeoutInterval(userFromStorage);
          // Dispatch loginSuccess. Questo triggererà loginSuccessTriggerUpdateLogin$
          // che a sua volta dispatcherà updateLogin, propagando i flag.
          console.log('[AuthEffects autoLogin$] Dispatching loginSuccess for autoLogin. User role from storage:', userFromStorage.ruolo);
          return loginSuccess({
            user: userFromStorage,
            redirect: true, // Intento di redirect dopo auto-login e aggiornamento ruolo
            isCustomerLogin: userFromStorage.ruolo === 'cliente'
          });
        }
        console.log('[AuthEffects autoLogin$] No valid user found in localStorage or token expired.');
        return { type: '[Auth] AutoLogin No User Found or Token Expired' }; // Azione No-Op
      })
    )
  );

  logout$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(autologout),
        tap(() => {
          console.log('[AuthEffects logout$] Logout action triggered.');
          this.authService.logoutS();
          this.router.navigate(['/auth/login-cliente']);
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
            return changePasswordSuccess();
          }),
          catchError((errResp) => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            const ErrorMessage = this.authService.getErrorMessage(
              errResp.error.error.message
            );
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
        return this.userService.updateUserInfo(action.localId, action.value).pipe(
          map((data) => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            this.store.dispatch(setErrorMessage({ message: null }));
            // Dopo aver cambiato le info, aggiorna lo stato utente nello store
            // passando redirect: false perché non vogliamo un redirect completo qui,
            // ma solo un aggiornamento dei dati.
            this.store.dispatch(updateLogin({ redirect: false, isCustomerLogin: action.value.ruolo === 'cliente' }));
            return changeInfoSuccess();
          }),
          catchError((errResp) => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            const ErrorMessage = this.authService.getErrorMessage(
              errResp.error.error.message
            );
            return of(setErrorMessage({ message: ErrorMessage }));
          })
        );
      })
    )
  );
}
