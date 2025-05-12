import { User } from 'src/app/shared/models/user.interface';
import { createAction, props } from '@ngrx/store';

export const LOGIN_START = '[Auth] Login start';
export const LOGIN_SUCCESS = '[Auth] Login Success';
export const LOGIN_FAIL = '[Auth] Login Fail';
export const AUTO_LOGIN_ACTION = '[Auth] Auto login';
export const UPDATE_LOGIN_START = '[Auth] Update login';
export const UPDATE_LOGIN_SUCCESS = '[Auth] Update login success';
export const LOGOUT_ACTION = '[Auth] Logout';
export const CHANGE_PASSWORD_START = '[Auth] Change password start';
export const CHANGE_PASSWORD_SUCCESST = '[Auth] Change password success';
export const CHANGE_INFO_START = '[Auth] Change info start';
export const CHANGE_INFO_SUCCESST = '[Auth] Change info success';

export const loginStart = createAction(
  LOGIN_START,
  props<{ email: string; password: string }>()
);

export const loginSuccess = createAction(
  LOGIN_SUCCESS,
  props<{ user: User; redirect: boolean }>()
);

export const loginFail = createAction(LOGIN_FAIL);

export const changePasswordStart = createAction(
  CHANGE_PASSWORD_START,
  props<{ idToken: string; password: string }>()
);
export const changePasswordSuccess = createAction(CHANGE_PASSWORD_SUCCESST);

export const changeInfoStart = createAction(
  CHANGE_INFO_START,
  props<{
    localId: string;
    value: User;
  }>()
);
export const changeInfoSuccess = createAction(CHANGE_INFO_SUCCESST);

export const autoLogin = createAction(AUTO_LOGIN_ACTION);
export const autologout = createAction(LOGOUT_ACTION);

export const updateLogin = createAction(UPDATE_LOGIN_START);
export const updateLoginSuccess = createAction(
  UPDATE_LOGIN_SUCCESS,
  props<{ user: User; redirect: boolean }>()
);

export const dummyAction = createAction('[dummy action]');
