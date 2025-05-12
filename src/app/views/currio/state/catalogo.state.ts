import { Event } from "src/app/shared/models/currio.model";
import { CurrioSubmission } from "src/app/shared/models/currio-submission.model"; // << AGGIUNGI

export interface EventsState {
  events: Event[];
  currioSubmissions: CurrioSubmission[]; // << AGGIUNGI
}

export const initialState: EventsState = {
  events: [],
  currioSubmissions: [], // << AGGIUNGI
};
