import { Event } from "src/app/shared/models/currio.model";
import { CurrioSubmission } from "src/app/shared/models/currio-submission.model"; // << AGGIUNGI
import { createAction, props } from '@ngrx/store';

// ... azioni esistenti per Event ...

export const LOAD_PRODUCTS = '[events page] load events';
export const LOAD_PRODUCTS_SUCCESS = '[events page] load events success';

// << NUOVE AZIONI PER CURRIO SUBMISSIONS >>
export const LOAD_CURRIO_SUBMISSIONS = '[events page] load currio submissions';
export const LOAD_CURRIO_SUBMISSIONS_SUCCESS = '[events page] load currio submissions success';
// export const DELETE_CURRIO_SUBMISSION = '[events page] delete currio submission'; // Esempio se vuoi aggiungere elimina
// export const DELETE_CURRIO_SUBMISSION_SUCCESS = '[events page] delete currio submission success'; // Esempio

// ... (resto delle azioni per Event) ...

export const loadEvents = createAction(LOAD_PRODUCTS);
export const loadEventsSuccess = createAction(
  LOAD_PRODUCTS_SUCCESS,
  props<{ events: Event[] }>()
);

// << NUOVE AZIONI EXPORTED PER CURRIO SUBMISSIONS >>
export const loadCurrioSubmissions = createAction(LOAD_CURRIO_SUBMISSIONS);
export const loadCurrioSubmissionsSuccess = createAction(
  LOAD_CURRIO_SUBMISSIONS_SUCCESS,
  props<{ submissions: CurrioSubmission[] }>()
);

// export const deleteCurrioSubmission = createAction(DELETE_CURRIO_SUBMISSION, props<{ id: string }>()); // Esempio
// export const deleteCurrioSubmissionSuccess = createAction(DELETE_CURRIO_SUBMISSION_SUCCESS, props<{ id: string }>()); // Esempio
