// src/app/shared/servizi/auth.service.ts
import { Injectable, NgZone } from '@angular/core';
import * as auth from 'firebase/auth';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/shared/app.state';
import { AuthResponseData } from '../models/AuthResponseData';
import { ChangePasswordResponseData } from '../models/ChangePasswordResponseData';
import { User } from '../models/user.interface';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { autologout, loginSuccess } from 'src/app/views/auth/state/auth.action';
import { User as FirebaseAuthUserType } from '@firebase/auth-types';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  timeoutInterval: any;

  Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    timer: 3000,
    timerProgressBar: true,
  });

  constructor(
    public afs: AngularFirestore,
    public afAuth: AngularFireAuth,
    public router: Router,
    public ngZone: NgZone,
    private store: Store<AppState>,
    private http: HttpClient
  ) {}

  // Accedi con e-mail/password (usato da NGRX effects)
  SignIn(email: string, password: string): Observable<AuthResponseData> {
    return this.http.post<AuthResponseData>(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.firebase.apiKey}`,
      { email, password, returnSecureToken: true }
    );
  }

  // Metodo per cambiare la password tramite API Firebase Identity Toolkit
  ChangePassword(idToken: string,password: string): Observable<ChangePasswordResponseData> {
    return this.http.post<ChangePasswordResponseData>(
      `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${environment.firebase.apiKey}`,
      { idToken: idToken, password: password, returnSecureToken: true }
    );
  }

  // Metodo per cambiare le informazioni dell'utente (es. displayName, photoURL)
  ChangeInfo(idToken: string, displayName: string, photoURL: string): Observable<any> {
    return this.http.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${environment.firebase.apiKey}`,
      { idToken: idToken, displayName: displayName, photoUrl: photoURL, returnSecureToken: false }
    );
  }


  // Registrazione con email/password
  SignUp(email: string, password: string) {
    return this.afAuth
      .createUserWithEmailAndPassword(email, password)
      .then((result) => {
        if (result.user) {
          return this.SetUserData(result.user).then(() => {
            this.SendVerificationMail();
          });
        } else {
          throw new Error("User object is null after registration.");
        }
      })
      .catch((error) => {
        this.Toast.fire(this.getErrorMessage(error.code || error.message), '', 'error');
        throw error;
      });
  }

 SetUserData(firebaseUser: FirebaseAuthUserType | any): Promise<void> {
    if (!firebaseUser || !firebaseUser.uid) {
      console.error('[AuthService.SetUserData] Chiamato con un oggetto utente non valido:', firebaseUser);
      return Promise.reject(new Error('Oggetto utente non valido per SetUserData'));
    }

    const userRef: AngularFirestoreDocument<User> = this.afs.doc<User>(
      `users/${firebaseUser.uid}`
    );

    const ruoloDaUsare = firebaseUser.ruolo || 'cliente';

    const dataToSet: User = {
      localId: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || 'assets/images/default-avatar.png',
      emailVerified: firebaseUser.emailVerified || false,
      ruolo: ruoloDaUsare,
      cellulare: firebaseUser.cellulare !== undefined ? firebaseUser.cellulare : null,
    };

    console.log(`[AuthService.SetUserData] Scrittura/Aggiornamento su Firestore per users/${firebaseUser.uid} con payload:`, JSON.parse(JSON.stringify(dataToSet)));

    return userRef.set(dataToSet, { merge: true })
      .then(() => {
        console.log(`[AuthService.SetUserData] Dati utente per ${firebaseUser.uid} salvati/aggiornati in Firestore.`);
      })
      .catch(error => {
        console.error(`[AuthService.SetUserData] Errore nel salvare i dati utente ${firebaseUser.uid} in Firestore:`, error);
        throw error;
      });
  }

  // Invia e-mail di verifica
  SendVerificationMail() {
    return this.afAuth.currentUser
      .then((u: any) => {
        if (u) {
          return u.sendEmailVerification();
        }
        throw new Error("Nessun utente corrente per inviare email di verifica.");
      })
      .then(() => {
        console.log("Email di verifica inviata.");
      })
      .catch(error => {
        console.error("Errore invio email di verifica:", error);
        this.Toast.fire(this.getErrorMessage(error.code || error.message), '', 'error');
      });
  }

  formatUser(data: AuthResponseData): User {
    const now = new Date();
    const expiresInMilliseconds = Number(data.expiresIn) * 1000;
    const expirationDate = new Date(now.getTime() + expiresInMilliseconds);

    const formattedUser: User = {
      email: data.email,
      token: data.idToken,
      localId: data.localId,
      expirationDate: expirationDate,
      displayName: undefined,
      photoURL: undefined,
      emailVerified: undefined,
      ruolo: undefined,
      cellulare: undefined,
    };
    console.log('[AuthService formatUser] User object created:', JSON.parse(JSON.stringify(formattedUser))); // LOG
    return formattedUser;
  }

  setUserInLocalStorage(user: User | null) {
    if (user) {
      localStorage.setItem('userData', JSON.stringify(user));
      this.runTimeoutInterval(user);
    } else {
      localStorage.removeItem('userData');
    }
  }

  runTimeoutInterval(user: User) {
    if (this.timeoutInterval) {
      clearTimeout(this.timeoutInterval);
    }
    if (user && user.expirationDate) {
        const expiresIn = new Date(user.expirationDate).getTime() - new Date().getTime();
        if (expiresIn > 0) {
            this.timeoutInterval = setTimeout(() => {
            this.store.dispatch(autologout());
            }, expiresIn);
        } else {
            this.store.dispatch(autologout());
        }
    }
  }

  getUserFromLocalStorage(): User | null {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      const expirationDate = new Date(userData.expirationDate);
      const user: User = {
        ...userData,
        expirationDate: expirationDate,
      };
      return user;
    }
    return null;
  }

  getErrorMessage(message: string): string {
    switch (message) {
      case 'EMAIL_NOT_FOUND':
      case 'auth/user-not-found':
        return 'Nessun utente trovato con questa email.';
      case 'INVALID_PASSWORD':
      case 'auth/wrong-password':
        return 'Password non corretta.';
      case 'auth/invalid-email':
        return 'L\'indirizzo email non è valido.';
      case 'auth/email-already-in-use':
        return 'L\'indirizzo email è già in uso da un altro account.';
      case 'auth/weak-password':
        return 'La password è troppo debole. Deve essere di almeno 6 caratteri.';
      case 'NOT_MATCHES_PASSWORD':
        return 'Le password non coincidono.';
      case 'MISSING_PASSWORD':
        return 'Inserisci una password.';
      case 'INVALID_ID_TOKEN':
      case 'auth/invalid-id-token':
        return 'Token non valido, rieffetua il login';
      case 'WEAK_PASSWORD':
        return 'La password è troppo debole';
      case 'INVALID_REQ_TYPE':
        return 'Richiesta non valida';
      case 'auth/invalid-argument':
        return 'Argomento non valido nella richiesta. Controlla i dati inviati a Firebase.';
      default:
        console.error("Firebase Auth Error Code non mappato o errore generico:", message);
        return 'Si è verificato un errore sconosciuto. Riprova.';
    }
  }

 SignOut(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    this.store.dispatch(autologout());
  }

  logoutS() {
    this.afAuth.signOut().then(() => {
      localStorage.removeItem('userData');
      if (this.timeoutInterval) {
        clearTimeout(this.timeoutInterval);
        this.timeoutInterval = null;
      }
      console.log('Utente disconnesso e localStorage pulito.');
    }).catch(error => {
      console.error("Errore durante il logout da Firebase:", error);
    });
  }

  // Autenticazione con Google
  GoogleAuth() {
    const provider = new auth.GoogleAuthProvider();
    return this.AuthLogin(provider);
  }

  // Logica di autenticazione generica per provider (es. Google)
  AuthLogin(provider: auth.AuthProvider) {
    return this.afAuth
      .signInWithPopup(provider)
      .then((result) => {
        if (result.user) {
          return this.SetUserData(result.user).then(() => {
            const authData: AuthResponseData = {
                idToken: (result.user as any).stsTokenManager.accessToken,
                email: result.user.email || '',
                refreshToken: (result.user as any).stsTokenManager.refreshToken,
                expiresIn: ((result.user as any).stsTokenManager.expirationTime / 1000).toString(),
                localId: result.user.uid,
                registered: true,
            };
            const user = this.formatUser(authData);
            this.store.dispatch(loginSuccess({ user, redirect: true }));
          });
        }
        return Promise.reject(new Error("User object is null after social login."));
      })
      .catch((error) => {
        this.Toast.fire(this.getErrorMessage(error.code || error.message), '', 'error');
        throw error;
      });
  }

  // Reimposta password dimenticata
  ForgotPassword(passwordResetEmail: string) {
    return this.afAuth
      .sendPasswordResetEmail(passwordResetEmail)
      .then(() => {
        Swal.fire('Email Inviata', 'Controlla la tua posta per resettare la password.', 'info');
        this.router.navigate(['auth/login']);
      })
      .catch((error) => {
        this.Toast.fire(this.getErrorMessage(error.code || error.message), '', 'error');
      });
  }
}
