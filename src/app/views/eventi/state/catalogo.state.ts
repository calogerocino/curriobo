import { Event } from "src/app/shared/models/event.model";

export interface EventsState {
  events: Event[];
}

export const initialState: EventsState = {
  events: [],
};
