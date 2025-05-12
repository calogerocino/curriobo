import { EventsState } from './catalogo.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
// import { CurrioSubmission } from 'src/app/shared/models/currio-submission.model'; // Non necessario qui se non si filtra per ID

export const PRODUCT_STATE_NAME = 'events'; // Considera di rinominare se gestisce più di 'products'
const getEventsState = createFeatureSelector<EventsState>(PRODUCT_STATE_NAME);

export const getEvents = createSelector(getEventsState, (state) => {
  return state.events;
});

export const getEventById = createSelector(
    getEventsState,
    (state: EventsState, props: { id: string | null }) => { // props.id può essere null
        if (!props.id) return undefined; // Gestisci il caso di ID nullo
        return state.events.find((event) => event.id === props.id);
    }
);

// << NUOVO SELETTORE PER CURRIO SUBMISSIONS >>
export const getCurrioSubmissions = createSelector(getEventsState, (state) => { // Nome cambiato per chiarezza
  return state.currioSubmissions;
});
