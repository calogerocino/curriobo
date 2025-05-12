export interface ChangePasswordResponseData {
  localId: string;
  email: string;
  passwordHash: string;
  idToken: string;
  refreshToken: string;
  expiresIn: string;
}
