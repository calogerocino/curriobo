import { createAction, props } from '@ngrx/store';
import { Currio } from 'src/app/shared/models/currio.model';
import { CurrioSubmission } from 'src/app/shared/models/currio-submission.model';

// Azioni per i Currio
export const LOAD_CURRIOS = '[Currio Page] Load Currios';
export const LOAD_CURRIOS_SUCCESS = '[Currio API] Load Currios Success';
export const LOAD_CURRIOS_FAILURE = '[Currio API] Load Currios Failure';

export const LOAD_CURRIO_BY_ID = '[Currio Page] Load Currio By Id';
export const LOAD_CURRIO_BY_ID_SUCCESS = '[Currio API] Load Currio By Id Success';
export const LOAD_CURRIO_BY_ID_FAILURE = '[Currio API] Load Currio By Id Failure';

export const CREATE_CURRIO = '[Currio Page] Create Currio';
export const CREATE_CURRIO_SUCCESS = '[Currio API] Create Currio Success';
export const CREATE_CURRIO_FAILURE = '[Currio API] Create Currio Failure';

export const UPDATE_CURRIO = '[Currio Page] Update Currio';
export const UPDATE_CURRIO_SUCCESS = '[Currio API] Update Currio Success';
export const UPDATE_CURRIO_FAILURE = '[Currio API] Update Currio Failure';

export const DELETE_CURRIO = '[Currio Page] Delete Currio';
export const DELETE_CURRIO_SUCCESS = '[Currio API] Delete Currio Success';
export const DELETE_CURRIO_FAILURE = '[Currio API] Delete Currio Failure';

// Azioni per Currio Submissions (già esistenti, verifica i nomi)
export const LOAD_CURRIO_SUBMISSIONS = '[Events Page] load currio submissions';
export const LOAD_CURRIO_SUBMISSIONS_SUCCESS = '[Events Page] load currio submissions success';


// Implementazioni Azioni Currio
export const loadCurrios = createAction(LOAD_CURRIOS);
export const loadCurriosSuccess = createAction(LOAD_CURRIOS_SUCCESS, props<{ currios: Currio[] }>());
export const loadCurriosFailure = createAction(LOAD_CURRIOS_FAILURE, props<{ error: any }>());

export const loadCurrioById = createAction(LOAD_CURRIO_BY_ID, props<{ id: string }>());
export const loadCurrioByIdSuccess = createAction(LOAD_CURRIO_BY_ID_SUCCESS, props<{ currio: Currio }>());
export const loadCurrioByIdFailure = createAction(LOAD_CURRIO_BY_ID_FAILURE, props<{ error: any }>());

export const createCurrio = createAction(CREATE_CURRIO, props<{ currio: Omit<Currio, 'id'> }>());
export const createCurrioSuccess = createAction(CREATE_CURRIO_SUCCESS, props<{ currio: Currio }>());
export const createCurrioFailure = createAction(CREATE_CURRIO_FAILURE, props<{ error: any }>());

export const updateCurrio = createAction(UPDATE_CURRIO, props<{ currio: Currio }>());
export const updateCurrioSuccess = createAction(UPDATE_CURRIO_SUCCESS, props<{ currio: {id: string, changes: Partial<Currio>} }>());
export const updateCurrioFailure = createAction(UPDATE_CURRIO_FAILURE, props<{ error: any }>());

export const deleteCurrio = createAction(DELETE_CURRIO, props<{ id: string }>());
export const deleteCurrioSuccess = createAction(DELETE_CURRIO_SUCCESS, props<{ id: string }>());
export const deleteCurrioFailure = createAction(DELETE_CURRIO_FAILURE, props<{ error: any }>());

export const loadCurrioSubmissions = createAction(LOAD_CURRIO_SUBMISSIONS);
export const loadCurrioSubmissionsSuccess = createAction(
  LOAD_CURRIO_SUBMISSIONS_SUCCESS,
  props<{ submissions: CurrioSubmission[] }>()
);
