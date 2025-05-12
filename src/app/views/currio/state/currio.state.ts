import { Currio } from "src/app/shared/models/currio.model";
import { CurrioSubmission } from "src/app/shared/models/currio-submission.model";

export interface CurrioState {
  currios: Currio[];
  selectedCurrio: Currio | null;
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
