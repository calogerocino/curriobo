import { AUTH_STATE_NAME } from '../views/auth/state/auth.selector';
import { SHARED_STATE_NAME } from './store/shared.selectors';

import { AuthReducer } from '../views/auth/state/auth.reducer';
import { AuthState } from '../views/auth/state/auth.state';
import { SharedState } from './store/shared.state';
import { SharedReducer } from './store/shared.reducer';

export interface AppState {
  [SHARED_STATE_NAME]: SharedState;
  [AUTH_STATE_NAME]: AuthState;
}

export const appReducer = {
  [SHARED_STATE_NAME]: SharedReducer,
  [AUTH_STATE_NAME]: AuthReducer,
};
