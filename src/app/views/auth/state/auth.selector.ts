import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.state';
import { User } from 'src/app/shared/models/user.interface';

export const AUTH_STATE_NAME = 'auth';

const getAuthState = createFeatureSelector<AuthState>(AUTH_STATE_NAME);

export const isAuthenticated = createSelector(getAuthState, (state) => !!state.user);
export const isEmailVerified = createSelector(getAuthState, (state) => state.user?.emailVerified);

export const getUser = createSelector(getAuthState, (state) => state.user);

export const getUserToken = createSelector(getAuthState, (state) => state.user?.token);

export const getUserlocalId = createSelector(getAuthState, (state) => state.user?.localId);
export const isUserAdmin = createSelector(getUser, (user: User | null) => {
    return user ? user.ruolo === 'admin' : false;
});
