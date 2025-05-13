// src/app/shared/servizi/auth.service.ts
import { Injectable, NgZone } from '@angular/core';
import * as auth from 'firebase/auth'; // Per GoogleAuthProvider e altre operazioni auth
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
import { User } from '../models/user.interface'; // La tua interfaccia User
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
// --- IMPORT CORRETTO PER LE AZIONI NGRX ---
import { autologout, loginSuccess } from 'src/app/views/auth/state/auth.action';
// Importa il tipo User da Firebase Auth se necessario per type hinting più preciso
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
    public afs: AngularFirestore, // AngularFirestore per interagire con Firestore
    public afAuth: AngularFireAuth, // AngularFireAuth per operazioni di autenticazione
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
  ChangeInfo(idToken: string, displayName: string, photoURL: string): Observable<any> { // Potresti definire un'interfaccia specifica per la risposta
    return this.http.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${environment.firebase.apiKey}`,
      { idToken: idToken, displayName: displayName, photoUrl: photoURL, returnSecureToken: false } // returnSecureToken può essere false se non serve un nuovo token
    );
  }


  // Registrazione con email/password
  SignUp(email: string, password: string) {
    return this.afAuth
      .createUserWithEmailAndPassword(email, password)
      .then((result) => {
        if (result.user) {
          this.SetUserData(result.user);
          this.SendVerificationMail();
        } else {
          throw new Error("User object is null after registration.");
        }
      })
      .catch((error) => {
        this.Toast.fire(this.getErrorMessage(error.code || error.message), '', 'error');
        throw error;
      });
  }

  // Salva/Aggiorna i dati dell'utente in Firestore
  SetUserData(firebaseUser: FirebaseAuthUserType | any) {
    if (!firebaseUser || !firebaseUser.uid) {
      console.error('SetUserData chiamato con un oggetto utente non valido:', firebaseUser);
      return Promise.reject('Oggetto utente non valido per SetUserData');
    }

    const userRef: AngularFirestoreDocument<User> = this.afs.doc(
      `users/${firebaseUser.uid}`
    );

    const userData: Partial<User> = {
      localId: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || '',
      emailVerified: firebaseUser.emailVerified || false,
    };

    return userRef.set(userData as User, { merge: true })
      .then(() => {
        console.log(`Dati utente per ${firebaseUser.uid} salvati/aggiornati in Firestore.`);
      })
      .catch(error => {
        console.error(`Errore nel salvare i dati utente ${firebaseUser.uid} in Firestore:`, error);
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
        // Non reindirizzare qui, lascia che sia il chiamante a gestire il routing
      })
      .catch(error => {
        console.error("Errore invio email di verifica:", error);
        this.Toast.fire(this.getErrorMessage(error.code || error.message), '', 'error');
      });
  }

  // Formatta l'utente dalla risposta dell'API per lo store NGRX
  formatUser(data: AuthResponseData): User {
    const now = new Date();
    const expiresInMilliseconds = Number(data.expiresIn) * 1000;
    const expirationDate = new Date(now.getTime() + expiresInMilliseconds);

    return {
      email: data.email,
      token: data.idToken,
      localId: data.localId,
      expirationDate: expirationDate,
      displayName: undefined,
      photoURL: undefined,
      emailVerified: data.registered, // Considera se questo è il campo corretto per emailVerified
                                      // FirebaseUser.emailVerified è più diretto.
      ruolo: undefined,
      cellulare: undefined,
    };
  }

  // Salva i dati utente in localStorage
  setUserInLocalStorage(user: User | null) {
    if (user) {
      localStorage.setItem('userData', JSON.stringify(user));
      this.runTimeoutInterval(user);
    } else {
      localStorage.removeItem('userData');
    }
  }

  // Esegue il timeout per il logout automatico
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
            // Token già scaduto
            this.store.dispatch(autologout());
        }
    }
  }

  // Recupera i dati utente da localStorage
  getUserFromLocalStorage(): User | null {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      // Ricostruisci l'oggetto Date per expirationDate
      const expirationDate = new Date(userData.expirationDate);
      const user: User = {
        ...userData,
        expirationDate: expirationDate,
      };
      // Non avviare il timeout qui, dovrebbe essere fatto quando l'utente viene impostato (es. autoLogin)
      // this.runTimeoutInterval(user);
      return user;
    }
    return null;
  }

  // Mappa i codici di errore Firebase a messaggi user-friendly
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
        return 'Le password non corrispondono.';
      case 'MISSING_PASSWORD':
        return 'Inserisci una password.';
      case 'INVALID_ID_TOKEN':
        return 'Token non valido, rieffetua il login';
      case 'WEAK_PASSWORD': // Già presente sopra come auth/weak-password
        return 'La password è troppo debole';
      case 'INVALID_REQ_TYPE':
        return 'Richiesta non valida';
      default:
        console.error("Firebase Auth Error Code:", message); // Logga l'errore originale
        return 'Si è verificato un errore sconosciuto. Riprova.';
    }
  }

  // Logout dell'utente
  SignOut(event?: Event) { // Aggiunto parametro opzionale event
    if (event) {
      event.preventDefault();
    }
    this.store.dispatch(autologout()); // L'effect di logout gestirà la pulizia
  }

  // Logica effettiva di logout (chiamata dall'effect)
  logoutS() {
    this.afAuth.signOut().then(() => {
      localStorage.removeItem('userData');
      if (this.timeoutInterval) {
        clearTimeout(this.timeoutInterval);
        this.timeoutInterval = null;
      }
      // Il reindirizzamento viene gestito dall'effect di logout
      // this.router.navigate(['auth/login']);
      console.log('Utente disconnesso e localStorage pulito.');
    }).catch(error => {
      console.error("Errore durante il logout da Firebase:", error);
      // Gestisci l'errore se necessario
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
          // Dopo il login con provider, assicurati che i dati siano in Firestore
          this.SetUserData(result.user).then(() => {
            // Dispatch un'azione di login success per aggiornare lo store NGRX
            // Questo dovrebbe essere gestito da un effect apposito per il social login
            // o integrato nel flusso di login esistente.
            // Per ora, reindirizziamo e assumiamo che lo stato NGRX venga aggiornato.
            const authData: AuthResponseData = {
                idToken: (result.user as any).stsTokenManager.accessToken,
                email: result.user.email || '',
                refreshToken: (result.user as any).stsTokenManager.refreshToken,
                expiresIn: ((result.user as any).stsTokenManager.expirationTime / 1000).toString(),
                localId: result.user.uid,
                registered: true, // o false se è il primo login
            };
            const user = this.formatUser(authData);
            this.store.dispatch(loginSuccess({ user, redirect: true })); // Dispatch loginSuccess
            // this.router.navigate(['admin']); // Il redirect è gestito dall'effect di loginSuccess
          });
        }
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
