import { User } from "src/app/shared/models/user.interface";

export interface AuthState {
  user: User | null;
}

export const initialState: AuthState = {
  user: null,
};
