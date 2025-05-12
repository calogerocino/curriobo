export interface ChangePasswordResponseData {
  localId: string;
  email: string;
  displayName: string;
  photoURL: string;
  passwordHash: string;
  idToken: string;
  refreshToken: string;
  expiresIn: string;
}
