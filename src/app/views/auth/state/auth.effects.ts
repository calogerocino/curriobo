import { AuthService } from 'src/app/shared/servizi/auth.service';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
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
      switchMap((action) => {
        return this.authService.SignIn(action.email, action.password).pipe(
          map((data) => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            this.store.dispatch(setErrorMessage({ message: null }));
            const user = this.authService.formatUser(data);
            this.store.dispatch(updateLogin());
            this.authService.setUserInLocalStorage(user);
            return loginSuccess({ user, redirect: true });
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

  loginRedirect$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(loginSuccess),
        tap((action) => {
          // if (action.redirect) {
          this.store.dispatch(updateLogin());
          this.router.navigate(['admin']);
          //  }
        })
      );
    },
    { dispatch: false }
  );

  autoLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(autoLogin),
      map(() => {
        const user = this.authService.getUserFromLocalStorage();
        return loginSuccess({ user, redirect: false });
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
      switchMap(([action, uid, user]) =>
        this.userService.MergeDatiUtente(uid, user)
      ),
      map((user) => {
        this.authService.setUserInLocalStorage(user);
        return updateLoginSuccess({ user, redirect: false });
      })
    )
  );

  logout$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(autologout),
        tap(() => {
          this.authService.logoutS();
          this.router.navigate(['auth/login']);
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
