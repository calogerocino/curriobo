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
import { Observable } from 'rxjs';
import { autologout } from 'src/app/views/auth/state/auth.action';

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

  // Accedi con e-mail/password
  SignIn(email: string, password: string): Observable<AuthResponseData> {
    return this.http.post<AuthResponseData>(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.firebase.apiKey}`,
      { email, password, returnSecureToken: true }
    );
  }

  ChangePassword(
    idToken: string,
    password: string
  ): Observable<ChangePasswordResponseData> {
    return this.http.post<ChangePasswordResponseData>(
      `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${environment.firebase.apiKey}`,
      { idToken, password, returnSecureToken: true }
    );
  }

  ChangeInfo(
    idToken: string,
    displayName: string,
    email: string,
    photoURL: string
  ): Observable<ChangePasswordResponseData> {
    return this.http.post<ChangePasswordResponseData>(
      `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${environment.firebase.apiKey}`,
      { idToken, displayName, email, photoURL, returnSecureToken: true }
    );
  }

  formatUser(data: AuthResponseData): User {
    const now = new Date();
    return {
      email: data.email,
      token: data.idToken,
      localId: data.localId,
      expirationDate: new Date(now.getDate() + Number(data.expiresIn) * 1000),
      emailVerified: data.registered,
    };
  }

  SetUserData(user: any) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users/${user.uid}`
    );
    const userData: User = {
      email: user.email,
      token: user.refreshToken,
      localId: user.uid,
      expirationDate: user.expirationDate,
      displayName: user.displayName,
      photoURL: user.photoURL,
      ruolo: user.ruolo,
      emailVerified: user.emailVerified,
      cellulare: user.cellulare,
    };
    return userRef.set(userData, {
      merge: true,
    });
  }

  getErrorMessage(message: string) {
    switch (message) {
      case 'EMAIL_NOT_FOUND':
        return 'Email non trovata';
      case 'INVALID_PASSWORD':
        return 'Password non valida';
      case 'NOT_MATCHES_PASSWORD':
        return 'Le password non corrispondono';
      case 'MISSING_PASSWORD':
        return 'Inserisci una password.';
      case 'INVALID_ID_TOKEN':
        return 'Token non valido, rieffetua il login';
      case 'WEAK_PASSWORD':
        return 'La password è troppo debole';
      case 'INVALID_REQ_TYPE':
        return 'Richiesta non valida';
      default:
        return 'Errore sconosciuto, per favore riprova';
    }
  }

  setUserInLocalStorage(user: User) {
    localStorage.setItem('userData', JSON.stringify(user));

    this.runTimeoutInterval(user);
  }

  runTimeoutInterval(user: User) {
    let date = new Date().getTime();
    let expireIn = new Date(user.expirationDate).getTime();
    const expirationDate = expireIn + date;
    const timeInterval = expirationDate - date;

    setTimeout(() => {
      this.store.dispatch(autologout());
    }, timeInterval);
  }

  getUserFromLocalStorage() {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      const expirationDate = new Date(userData.expirationDate);
      const user: User = {
        email: userData.email,
        token: userData.token,
        localId: userData.localId,
        expirationDate,
      };
      this.runTimeoutInterval(user);
      return user;
    }
    return null;
  }

  // Disconnessione
  SignOut(event: Event) {
    event.preventDefault();
    this.store.dispatch(autologout());
  }

  logoutS() {
    localStorage.removeItem('userData');
    this.afAuth.signOut();
    if (this.timeoutInterval) {
      clearTimeout(this.timeoutInterval);
      this.timeoutInterval = null;
    }
  }

  //DA SISTEMAE CON NGRX
  checkAuth() {
    return this.afAuth.authState;
  }

  // Registrazione con email/password
  SignUp(email: string, password: string) {
    return this.afAuth
      .createUserWithEmailAndPassword(email, password)
      .then((result) => {
        /* Chiama la funzione SendVerificaitonMail()  quando un nuovo utente si registra
        su e restituisce la promessa */
        this.SetUserData(result.user);
        this.SendVerificationMail();
      })
      .catch((error) => {
        this.Toast.fire(error.message, '', 'error');
      });
  }

  // Invia e-mail di verifica quando un nuovo utente si registra
  SendVerificationMail() {
    return this.afAuth.currentUser
      .then((u: any) => u.sendEmailVerification())
      .then(() => {
        this.router.navigate(['auth/verifyemail']);
      });
  }

  // Reimposta password dimenticata
  ForgotPassword(passwordResetEmail: string) {
    return this.afAuth
      .sendPasswordResetEmail(passwordResetEmail)
      .then(() => {
        window.alert('Mail reset password inviato, controlla la tua posta.');
        this.router.navigate(['auth/login']);
      })
      .catch((error) => {
        this.Toast.fire(error, '', 'error');
      });
  }

  // Restituisce vero quando l'utente ha effettuato l'accesso e l'e-mail è stata verificata
  // get isLoggedIn(): boolean {
  //   // const user = JSON.parse(localStorage.getItem('user')!);
  //   const user = this.store.select(isAuthenticated);
  //   return user != null ? false : true;
  // }

  // Accedi con Google
  GoogleAuth() {
    return this.AuthLogin(new auth.GoogleAuthProvider()).then((res: any) => {
      this.router.navigate(['/app']);
    });
  }

  // Logica di autenticazione per eseguire provider di autenticazione
  AuthLogin(provider: any) {
    return this.afAuth
      .signInWithPopup(provider)
      .then((result) => {
        this.router.navigate(['/app']);
        this.SetUserData(result.user);
      })
      .catch((error) => {
        this.Toast.fire(error, '', 'error');
      });
  }
}
