import { createReducer, on } from '@ngrx/store';
import { initialState, CurrioState } from './currio.state';
import * as CurrioActions from './currio.action';
import { Currio } from 'src/app/shared/models/currio.model';

const _currioReducer = createReducer(
  initialState,
  on(
    CurrioActions.loadCurrios,
    CurrioActions.loadCurrioById,
    CurrioActions.createCurrio,
    CurrioActions.updateCurrio,
    CurrioActions.deleteCurrio,
    (state) => ({
      ...state,
      loading: true,
      error: null,
    })
  ),

  on(CurrioActions.loadCurriosSuccess, (state, { currios }) => ({
    ...state,
    currios: currios,
    loading: false,
  })),
  on(CurrioActions.loadCurrioByIdSuccess, (state, { currio }) => ({
    ...state,
    selectedCurrio: currio,
    currios: state.currios.find((c) => c.id === currio.id)
      ? state.currios.map((c) => (c.id === currio.id ? currio : c))
      : [...state.currios, currio],
    loading: false,
  })),
  on(CurrioActions.createCurrioSuccess, (state, { currio }) => ({
    ...state,
    currios: [...state.currios, currio],
    loading: false,
  })),
  on(CurrioActions.updateCurrioSuccess, (state, { currio }) => ({
    ...state,
    currios: state.currios.map((c) =>
      c.id === currio.id ? { ...c, ...currio.changes } : c
    ),
    selectedCurrio:
      state.selectedCurrio?.id === currio.id
        ? ({ ...state.selectedCurrio, ...currio.changes } as Currio)
        : state.selectedCurrio,
    loading: false,
  })),
  on(CurrioActions.deleteCurrioSuccess, (state, { id }) => ({
    ...state,
    currios: state.currios.filter((c) => c.id !== id),
    loading: false,
  })),

  on(
    CurrioActions.loadCurriosFailure,
    CurrioActions.loadCurrioByIdFailure,
    CurrioActions.createCurrioFailure,
    CurrioActions.updateCurrioFailure,
    CurrioActions.deleteCurrioFailure,
    (state, { error }) => ({
      ...state,
      loading: false,
      error: error,
    })
  ),

  on(CurrioActions.loadCurrioSubmissionsSuccess, (state, action) => {
    return {
      ...state,
      currioSubmissions: action.submissions,
    };
  })
);

export function currioReducer(state: CurrioState | undefined, action: any) {
  // Rinomina
  return _currioReducer(state, action);
}
