import {
  loadEventsSuccess,
  loadCurrioSubmissionsSuccess, // << AGGIUNGI
} from './currio.action';
import { createReducer, on } from '@ngrx/store';
import { initialState } from './currio.state';

const _productsReducer = createReducer(
  initialState,
  // on(addEventSuccess, (state, action) => {
  //   let event = { ...action.event };
  //   return {
  //     ...state,
  //     events: [...state.events, event],
  //   };
  // }),
  // on(updateEventSuccess, (state, action) => {
  //   const updatedEvents = state.events.map((event) => {
  //     return action.event.id === event.id ? action.event : event;
  //   });
  //   return {
  //     ...state,
  //     events: updatedEvents,
  //   };
  // }),
  // on(deleteEventSuccess, (state, { id }) => {
  //   const updatedEvents = state.events.filter((event) => {
  //     return event.id !== id;
  //   });
  //   return {
  //     ...state,
  //     events: updatedEvents,
  //   };
  // }),
  on(loadEventsSuccess, (state, action) => {
    return {
      ...state,
      events: action.events,
    };
  }),
  // << NUOVO REDUCER PER CURRIO SUBMISSIONS >>
  on(loadCurrioSubmissionsSuccess, (state, action) => {
    return {
      ...state,
      currioSubmissions: action.submissions,
    };
  })
  // Aggiungere qui altri reducer per deleteCurrioSubmissionSuccess se implementato
);

export function productsReducer(state: any, action: any) { // Mantieni any per ora se non vuoi definire un tipo unione complesso
  return _productsReducer(state, action);
}
