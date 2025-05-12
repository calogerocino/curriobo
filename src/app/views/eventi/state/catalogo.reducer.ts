import {
  loadEventsSuccess,
  addEventSuccess,
  updateEventSuccess,
  deleteEventSuccess,
} from './catalogo.action';
import { createReducer, on } from '@ngrx/store';
import { initialState } from './catalogo.state';

const _productsReducer = createReducer(
  initialState,
  on(addEventSuccess, (state, action) => {
    let event = { ...action.event };

    return {
      ...state,
      events: [...state.events, event],
    };
  }),
  on(updateEventSuccess, (state, action) => {
    const updatedEvents = state.events.map((event) => {
      return action.event.id === event.id ? action.event : event;
    });

    return {
      ...state,
      events: updatedEvents,
    };
  }),
  on(deleteEventSuccess, (state, { id }) => {
    const updatedEvents = state.events.filter((event) => {
      return event.id !== id;
    });

    return {
      ...state,
      events: updatedEvents,
    };
  }),
  on(loadEventsSuccess, (state, action) => {
    return {
      ...state,
      events: action.events,
    };
  })
);

export function productsReducer(state, action) {
  return _productsReducer(state, action);
}
