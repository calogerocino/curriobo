import { EventsState } from './catalogo.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
export const PRODUCT_STATE_NAME = 'events';
const getEventsState = createFeatureSelector<EventsState>(PRODUCT_STATE_NAME);

export const getEvents = createSelector(getEventsState, (state) => {
  return state.events;
});

export const getEventById = createSelector(getEventsState, (state, props) => {
  return state.events.find((event) => event.id === props.id);
});
