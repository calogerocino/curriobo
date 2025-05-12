export interface SharedState {
  showLoading: boolean;
  errorMessage: string | null;
}

export const initialState: SharedState = {
  showLoading: false,
  errorMessage: null,
};
