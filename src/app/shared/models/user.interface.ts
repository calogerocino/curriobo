export interface User {
  email?: string;
  token?: string;
  localId?: string;
  expirationDate?: Date;
  displayName?: string;
  photoURL?: string;
  ruolo?: 'admin' | 'cliente';
  emailVerified?: boolean;
  cellulare?: string;
}
