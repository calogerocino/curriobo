import { Event } from "src/app/shared/models/event.model";
import { createAction, props } from '@ngrx/store';

export const ADD_PRODUCT_ACTION = '[events page] add event';
export const ADD_PRODUCT_SUCCESS = '[events page] add event success';
export const UPDATE_PRODUCT_ACTION = '[events page] update event';
export const UPDATE_PRODUCT_SUCCESS = '[events page] update event success';
export const DELETE_PRODUCT_ACTION = '[events page] delete event';
export const DELETE_PRODUCT_SUCCESS = '[events page] delete event success';
export const LOAD_PRODUCTS = '[events page] load events';
export const LOAD_PRODUCTS_SUCCESS = '[events page] load events success';

export const addEvent = createAction(ADD_PRODUCT_ACTION, props<{ event: Event }>());
export const addEventSuccess = createAction(
  ADD_PRODUCT_SUCCESS,
  props<{ event: Event }>()
);

export const updateEvent = createAction(
  UPDATE_PRODUCT_ACTION,
  props<{ event: Event }>()
);
export const updateEventSuccess = createAction(
  UPDATE_PRODUCT_SUCCESS,
  props<{ event: Event }>()
);


export const deleteEvent = createAction(
  DELETE_PRODUCT_ACTION,
  props<{ id: string }>()
);
export const deleteEventSuccess = createAction(
  DELETE_PRODUCT_SUCCESS,
  props<{ id: string }>()
);

export const loadEvents = createAction(LOAD_PRODUCTS);
export const loadEventsSuccess = createAction(
  LOAD_PRODUCTS_SUCCESS,
  props<{ events: Event[] }>()
);
