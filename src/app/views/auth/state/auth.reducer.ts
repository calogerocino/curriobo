import { autologout, loginSuccess, updateLoginSuccess } from './auth.action';
import { createReducer, on } from '@ngrx/store';
import { initialState } from './auth.state';

const _authReducer = createReducer(
  initialState,
 on(loginSuccess, (state, action) => {
    const newState = {
      ...state,
      user: action.user,
    };
    return newState;
  }),
  on(autologout, (state) => {
    return {
      ...state,
      user: null,
    };
  }),
  on(updateLoginSuccess, (state, action) => {
    return {
      ...state,
      user: action.user,
    };
  })
);

export function AuthReducer(state, action) {
  return _authReducer(state, action);
}
