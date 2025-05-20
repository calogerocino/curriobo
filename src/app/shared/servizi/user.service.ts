// src/app/shared/servizi/user.service.ts
import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { User } from '../models/user.interface';
import { Observable, of, from } from 'rxjs';
import { map, catchError, take, switchMap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState } from '../app.state';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(
    private readonly afs: AngularFirestore,
    private readonly store: Store<AppState>
  ) {}

  SetUserData(user: Partial<User>): Promise<void> {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users/${user.localId}`
    );
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

  getFFList(): Observable<any[]> {
    return this.afs.collection('users').snapshotChanges();
  }

   getFFUser(uid: string): Observable<User | null> {
    console.log(`[UserService.getFFUser] Tentativo di recupero utente da Firestore con UID: ${uid}`);
    return this.afs
      .doc<User>(`users/${uid}`)
      .valueChanges()
      .pipe(
        take(1),
        map(firestoreUser => {
          if (firestoreUser) {
            console.log(`[UserService.getFFUser] Dati GREZZI recuperati da Firestore per UID ${uid}:`, JSON.parse(JSON.stringify(firestoreUser)));
          } else {
            console.warn(`[UserService.getFFUser] NESSUN documento trovato in Firestore per UID: ${uid}`);
          }
          return firestoreUser || null;
        }),
        catchError(error => {
          console.error(`[UserService.getFFUser] Errore durante il recupero del documento per UID ${uid} da Firestore:`, error);
          return of(null);
        })
      );
  }

  MergeDatiUtente(uid: string, userFromAuth: User): Observable<User> {
    console.log(`[UserService.MergeDatiUtente] Inizio merge per UID: ${uid}`);
    console.log(`[UserService.MergeDatiUtente] Dati da Auth (userFromAuth):`, JSON.parse(JSON.stringify(userFromAuth)));

    return this.getFFUser(uid).pipe(
      map(firestoreUser => {
        console.log(`[UserService.MergeDatiUtente] Dati da Firestore (firestoreUser) per UID ${uid}:`, firestoreUser ? JSON.parse(JSON.stringify(firestoreUser)) : null);

        if (!firestoreUser) {
          console.warn(`[UserService.MergeDatiUtente] Utente NON trovato in Firestore con UID: ${uid}. Uso dati da Auth e default per ruolo 'cliente'.`);
          const userSenzaDatiFirestore: User = {
            ...userFromAuth,
            displayName: userFromAuth.displayName || 'Nuovo Utente (No Firestore)',
            photoURL: userFromAuth.photoURL || 'assets/images/default-avatar.png',
            emailVerified: userFromAuth.emailVerified || false,
            ruolo: userFromAuth.ruolo || 'cliente', // Default a 'cliente' se non specificato e non trovato
            cellulare: userFromAuth.cellulare || undefined,
          };
          console.log(`[UserService.MergeDatiUtente] Utente risultante (senza dati Firestore):`, JSON.parse(JSON.stringify(userSenzaDatiFirestore)));
          return userSenzaDatiFirestore;
        }

        const mergedUser: User = {
          ...userFromAuth, // Prende token, localId, expirationDate da Auth
          displayName: firestoreUser.displayName || userFromAuth.displayName || '', // Priorità a Firestore, poi Auth, poi stringa vuota
          photoURL: firestoreUser.photoURL || userFromAuth.photoURL || 'assets/images/default-avatar.png',
          emailVerified: firestoreUser.emailVerified !== undefined ? firestoreUser.emailVerified : (userFromAuth.emailVerified || false),
          ruolo: firestoreUser.ruolo || userFromAuth.ruolo || 'cliente', // Priorità a Firestore, poi Auth, poi default 'cliente'
          cellulare: firestoreUser.cellulare || userFromAuth.cellulare || undefined, // Priorità a Firestore, poi Auth
        };
        console.log(`[UserService.MergeDatiUtente] RUOLO da Firestore: ${firestoreUser.ruolo}, RUOLO in userFromAuth: ${userFromAuth.ruolo}, RUOLO finale in mergedUser: ${mergedUser.ruolo}`);
        console.log(`[UserService.MergeDatiUtente] Utente finale unito (mergedUser) per UID ${uid}:`, JSON.parse(JSON.stringify(mergedUser)));
        return mergedUser;
      }),
      catchError(error => {
        console.error(`[UserService.MergeDatiUtente] Errore CRITICO durante il recupero o merge per UID ${uid}:`, error);
        // Fallback a dati da Auth con default per ruolo
        const fallbackUser: User = {
            ...userFromAuth,
            displayName: userFromAuth.displayName || 'Utente (errore db)',
            photoURL: userFromAuth.photoURL || 'assets/images/default-avatar.png',
            emailVerified: userFromAuth.emailVerified || false,
            ruolo: 'cliente', // Default a 'cliente' in caso di errore critico
        };
        console.warn(`[UserService.MergeDatiUtente] Restituzione utente di fallback a causa di errore:`, JSON.parse(JSON.stringify(fallbackUser)));
        return of(fallbackUser);
      })
    );
  }

Searchuser(uid: string): Observable<User | null> {
  return this.getFFUser(uid).pipe(
    map(firestoreUser => firestoreUser) // semplicemente ritorna il risultato
  );
}

  updateUserInfo(localId: string, value: Partial<User>): Observable<void> {
    const updateData = Object.entries(value).reduce((acc, [key, val]) => {
      if (val !== undefined) { // Assicurati che solo i valori definiti vengano inclusi
        acc[key] = val;
      }
      return acc;
    }, {});

    if (Object.keys(updateData).length === 0) {
      // Nessun dato valido da aggiornare
      return of(undefined);
    }
    return from(this.afs.doc<User>(`users/${localId}`).update(updateData));
  }

  /**
   * Elimina il documento utente da Firestore.
   * @param userId L'ID dell'utente (localId) da eliminare.
   * @returns Promise che si risolve se l'eliminazione ha successo, altrimenti rigetta.
   */
  deleteFirestoreUser(userId: string): Promise<void> {
    console.log(`[UserService.deleteFirestoreUser] Tentativo di eliminare utente da Firestore con UID: ${userId}`);
    const userRef: AngularFirestoreDocument<User> = this.afs.doc(`users/${userId}`);
    return userRef.delete()
      .then(() => {
        console.log(`[UserService.deleteFirestoreUser] Documento utente ${userId} eliminato da Firestore.`);
      })
      .catch(error => {
        console.error(`[UserService.deleteFirestoreUser] Errore durante l'eliminazione del documento utente ${userId} da Firestore:`, error);
        // Non rilanciare l'errore qui se vuoi che l'effect continui con altre eliminazioni
        // Potresti voler solo loggare l'errore. Se vuoi che l'effect si fermi, rilancia l'errore.
        // throw error;
      });
  }
}
