// src/app/shared/servizi/user.service.ts
import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { User } from '../models/user.interface';
import { Store } from '@ngrx/store';
import { AppState } from '../app.state';
import { from, Observable, of } from 'rxjs'; // Importa Observable e of
import { map, catchError, take } from 'rxjs/operators'; // Importa map, catchError, take

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(
    private readonly afs: AngularFirestore,
    private readonly store: Store<AppState>
  ) {}

  /* Impostazione dei dati utente */
  SetUserData(user: Partial<User>): Promise<void> { // User può essere Partial per permettere aggiornamenti parziali
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users/${user.localId}`
    );
    // Filtra via i campi undefined prima di salvare, Firebase non li gradisce
    const userDataToSet = Object.entries(user).reduce((acc, [key, value]) => {
        if (value !== undefined) {
            acc[key] = value;
        }
        return acc;
    }, {});

    return userRef.set(userDataToSet, {
      merge: true,
    });
  }

  getFFList(): Observable<any[]> { // Mantenuto per ora, ma considera di tipizzarlo meglio se usato
    return this.afs.collection('users').snapshotChanges();
  }

  // Restituisce Observable<User[]>
  getFFUser(uid: string): Observable<User[]> {
    return this.afs
      .collection<User>('users', (ref) => ref.where('localId', '==', uid))
      .valueChanges() // Questo restituisce Observable<User[]>
      .pipe(take(1)); // Prende il primo valore emesso e completa, utile per letture singole
  }

  // Modificato per restituire Observable<User>
  MergeDatiUtente(uid: string, authUser: User): Observable<User> {
    return this.getFFUser(uid).pipe(
      map(firestoreUsersArray => {
        const firestoreUser = firestoreUsersArray.length > 0 ? firestoreUsersArray[0] : null;

        if (!firestoreUser) {
          console.warn(`[UserService.MergeDatiUtente] Utente NON trovato in Firestore con UID: ${uid}. Uso dati da Auth e default.`);
          // Restituisci l'utente da Auth con eventuali default se non c'è corrispondenza in Firestore
          // Questo è importante per i nuovi utenti che non hanno ancora un record in 'users'
          return {
            email: authUser.email,
            token: authUser.token,
            localId: authUser.localId,
            expirationDate: authUser.expirationDate,
            displayName: authUser.displayName || 'Nuovo Utente', // Potrebbe essere vuoto se non ancora impostato
            photoURL: authUser.photoURL || 'assets/images/default-avatar.png', // Immagine di default
            emailVerified: authUser.emailVerified || false,
            ruolo: authUser.ruolo || 'cliente', // Ruolo di default
            cellulare: authUser.cellulare || undefined,
          } as User;
        }

        // Utente trovato in Firestore, esegui il merge
        const mergedUser: User = {
          email: authUser.email, // Email da Auth (più aggiornato per l'autenticazione)
          token: authUser.token, // Token da Auth
          localId: authUser.localId, // UID da Auth
          expirationDate: authUser.expirationDate, // Scadenza token da Auth
          // Per gli altri campi, dai priorità a Firestore, poi ad Auth, poi a un default
          displayName: firestoreUser.displayName || authUser.displayName || '',
          photoURL: firestoreUser.photoURL || authUser.photoURL || 'assets/images/default-avatar.png',
          emailVerified: firestoreUser.emailVerified !== undefined ? firestoreUser.emailVerified : (authUser.emailVerified || false),
          ruolo: firestoreUser.ruolo || authUser.ruolo || 'cliente', // Priorità Firestore, poi Auth, poi default
          cellulare: firestoreUser.cellulare || authUser.cellulare || undefined,
        };
        return mergedUser;
      }),
      catchError(error => {
        console.error('[UserService.MergeDatiUtente] Errore durante il recupero o merge:', error);
        // In caso di errore, restituisci l'utente Auth come fallback per non interrompere il flusso
        const fallbackUser: User = {
            email: authUser.email,
            token: authUser.token,
            localId: authUser.localId,
            expirationDate: authUser.expirationDate,
            displayName: authUser.displayName || 'Utente (errore db)',
            photoURL: authUser.photoURL || 'assets/images/default-avatar.png',
            emailVerified: authUser.emailVerified || false,
            ruolo: authUser.ruolo || 'cliente',
            cellulare: authUser.cellulare || undefined,
        };
        return of(fallbackUser); // 'of' crea un Observable che emette il valore e completa
      })
    );
  }

  // Modificato per restituire Observable<User | null>
  Searchuser(uid: string): Observable<User | null> {
    return this.getFFUser(uid).pipe(
      map(usersArray => (usersArray.length > 0 ? usersArray[0] : null))
    );
  }

  updateUserInfo(localId: string, value: Partial<User>): Observable<void> {
    // Filtra i campi undefined prima dell'aggiornamento
    const updateData = Object.entries(value).reduce((acc, [key, val]) => {
        if (val !== undefined) {
            acc[key] = val;
        }
        return acc;
    }, {});
    if (Object.keys(updateData).length === 0) {
        return of(undefined); // Nessun dato da aggiornare
    }
    return from(this.afs.doc<User>(`users/${localId}`).update(updateData));
  }
}
