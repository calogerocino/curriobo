// src/app/views/auth/state/auth.effects.ts
import { AuthService } from 'src/app/shared/servizi/auth.service';
import { catchError, map, switchMap, tap, exhaustMap } from 'rxjs/operators'; // Aggiunto exhaustMap se non presente
import {
  autoLogin,
  autologout,
  changeInfoStart,
  changeInfoSuccess,
  changePasswordStart,
  changePasswordSuccess,
  loginStart,
  loginSuccess,
  updateLogin,
  updateLoginSuccess,
} from './auth.action';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  setErrorMessage,
  setLoadingSpinner,
} from 'src/app/shared/store/shared.actions';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/shared/app.state';
import { of } from 'rxjs';
import { UserService } from 'src/app/shared/servizi/user.service';
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
      // Usiamo exhaustMap per ignorare nuovi loginStart finché il precedente non è completato
      exhaustMap((action) => { // action qui contiene isCustomerLogin
        return this.authService.SignIn(action.email, action.password).pipe(
          map((data) => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            this.store.dispatch(setErrorMessage({ message: null }));
            const user = this.authService.formatUser(data);
            this.authService.setUserInLocalStorage(user); // Salva subito i dati base
            // Dispatch updateLogin per arricchire i dati utente dallo store/firestore se necessario
            // e per sincronizzare lo stato di NGRX con localStorage
            this.store.dispatch(updateLogin());
            // Passa isCustomerLogin a loginSuccess
            return loginSuccess({ user, redirect: true, isCustomerLogin: action.isCustomerLogin });
          }),
          catchError((errResp) => {
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

  loginRedirect$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(loginSuccess),
        tap((action) => { // action qui contiene isCustomerLogin
          if (action.redirect) { // Controlla se il reindirizzamento è richiesto
            if (action.isCustomerLogin) {
              this.router.navigate(['/cliente/account']); // Reindirizzamento Cliente
            } else {
              this.router.navigate(['/admin']); // Reindirizzamento Admin (o dashboard admin)
            }
          }
        })
      );
    },
    { dispatch: false }
  );

  autoLogin$ = createEffect(() => // Assicurati che autoLogin gestisca correttamente i dati utente da localStorage
        this.actions$.pipe(
        ofType(autoLogin),
        map(() => {
            const user = this.authService.getUserFromLocalStorage();
            if (user) {
            // È importante rieseguire il timeout per il logout automatico
            this.authService.runTimeoutInterval(user);
            // Puoi decidere se chiamare updateLogin anche qui per aggiornare i dati da Firestore
            // o se i dati in localStorage sono sufficienti per l'autologin.
            // Se chiami updateLogin, assicurati che non crei loop o condizioni di gara.
            // this.store.dispatch(updateLogin());
            // Per ora, ci fidiamo dei dati in localStorage per l'autologin.
            // Il flag isCustomerLogin non è presente in localStorage, quindi il redirect
            // dell'autologin potrebbe dover essere gestito diversamente o basarsi sul ruolo.
            // Per semplicità, l'autologin potrebbe reindirizzare a una dashboard generica
            // o alla pagina `/admin` e poi la logica interna decide se rimanere o spostare.
            // Oppure, lo stato 'user' nello store NGRX (popolato da Firestore) potrebbe avere un campo 'ruolo'.
            return loginSuccess({ user, redirect: false }); // redirect: false per autologin
            }
            return { type: '[Auth] AutoLogin No User Found' }; // o un'azione dummy
        })
        )
    );

    updateLogin$ = createEffect(() => // Questo effect è cruciale
        this.actions$.pipe(
        ofType(updateLogin),
        concatLatestFrom(() => [
            this.store.select(getUserlocalId), // Prende il localId dallo stato corrente (appena loggato o da localStorage)
            this.store.select(getUser),       // Prende l'utente (con token, email, ecc.) dallo stato corrente
        ]),
        switchMap(([_, uid, userState]) => { // _ è l'azione updateLogin, uid è localId, userState è l'utente NGRX
            if (!uid || !userState) {
            // Se uid o userState non sono validi, non possiamo procedere.
            // Questo potrebbe accadere se updateLogin viene chiamato prima che il login iniziale
            // o l'autologin abbiano popolato lo stato.
            return of(setErrorMessage({ message: 'Dati utente non pronti per l\'aggiornamento.' }));
            }
            // MergeDatiUtente dovrebbe prendere l'UID e l'IDToken (da userState.token)
            // per recuperare i dati completi da Firestore e fonderli.
            return this.userService.MergeDatiUtente(uid, userState).pipe(
            map((mergedUser) => {
                this.authService.setUserInLocalStorage(mergedUser); // Aggiorna localStorage con i dati completi
                return updateLoginSuccess({ user: mergedUser, redirect: false }); // Aggiorna lo store NGRX
            }),
            catchError(err => {
                console.error("Errore in updateLogin$ durante MergeDatiUtente:", err);
                return of(setErrorMessage({ message: 'Errore nell\'aggiornamento dei dati utente.' }));
            })
            );
        })
        )
    );

  logout$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(autologout),
        tap(() => {
          this.authService.logoutS(); // Chiama il metodo di logout dal servizio
          this.router.navigate(['/auth/login-cliente']); // O una pagina di logout/landing page
          localStorage.removeItem('userData'); // Assicurati che venga rimosso
          if (this.authService.timeoutInterval) {
            clearTimeout(this.authService.timeoutInterval);
          }
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
            console.log('errore', errResp.error.error.message);
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
            this.store.dispatch(updateLogin());
            return changeInfoSuccess();
          }),
          catchError((errResp) => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            console.log('errore', errResp.error.error.message);
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
