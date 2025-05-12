import { CurrioState } from './currio.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { Currio } from 'src/app/shared/models/currio.model';

export const CURRIO_STATE_NAME = 'currioState'; // Rinomina da PRODUCT_STATE_NAME o events
const getCurrioFeatureState = createFeatureSelector<CurrioState>(CURRIO_STATE_NAME);

export const getCurrios = createSelector(
  getCurrioFeatureState,
  (state) => state.currios
);

export const getCurrioById = createSelector(
  getCurrioFeatureState,
  (state: CurrioState, props: { id: string | null }) => {
    if (!props.id) return undefined;
    // Cerca prima nel selectedCurrio, poi nella lista
    if (state.selectedCurrio && state.selectedCurrio.id === props.id) {
        return state.selectedCurrio;
    }
    return state.currios.find((currio) => currio.id === props.id);
  }
);

export const getSelectedCurrio = createSelector( // Selettore per il currio attualmente in modifica
    getCurrioFeatureState,
    state => state.selectedCurrio
);

export const getCurrioLoading = createSelector(
    getCurrioFeatureState,
    state => state.loading
);

export const getCurrioError = createSelector(
    getCurrioFeatureState,
    state => state.error
);

// Selettore per Currio Submissions (già esistente, verifica nomi)
export const getCurrioSubmissions = createSelector(
    getCurrioFeatureState,
    (state) => state.currioSubmissions
);
