import { Currio } from "src/app/shared/models/currio.model"; // Usa il modello Currio
import { CurrioSubmission } from "src/app/shared/models/currio-submission.model";

export interface CurrioState { // Rinomina da EventsState
  currios: Currio[]; // Rinomina da events
  selectedCurrio: Currio | null; // Opzionale: per il currio caricato nella pagina di modifica
  currioSubmissions: CurrioSubmission[];
  loading: boolean;
  error: string | null;
}

export const initialState: CurrioState = {
  currios: [],
  selectedCurrio: null,
  currioSubmissions: [],
  loading: false,
  error: null,
};
