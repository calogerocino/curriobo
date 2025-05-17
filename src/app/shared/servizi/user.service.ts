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
            ruolo: userFromAuth.ruolo || 'cliente',
            cellulare: userFromAuth.cellulare || undefined,
          };
          console.log(`[UserService.MergeDatiUtente] Utente risultante (senza dati Firestore):`, JSON.parse(JSON.stringify(userSenzaDatiFirestore)));
          return userSenzaDatiFirestore;
        }

        const mergedUser: User = {
          ...userFromAuth,
          displayName: firestoreUser.displayName || userFromAuth.displayName || '',
          photoURL: firestoreUser.photoURL || userFromAuth.photoURL || 'assets/images/default-avatar.png',
          emailVerified: firestoreUser.emailVerified !== undefined ? firestoreUser.emailVerified : (userFromAuth.emailVerified || false),
          ruolo: firestoreUser.ruolo || userFromAuth.ruolo || 'cliente',
          cellulare: firestoreUser.cellulare || userFromAuth.cellulare || undefined,
        };
        console.log(`[UserService.MergeDatiUtente] RUOLO da Firestore: ${firestoreUser.ruolo}, RUOLO in userFromAuth: ${userFromAuth.ruolo}, RUOLO finale in mergedUser: ${mergedUser.ruolo}`);
        console.log(`[UserService.MergeDatiUtente] Utente finale unito (mergedUser) per UID ${uid}:`, JSON.parse(JSON.stringify(mergedUser)));
        return mergedUser;
      }),
      catchError(error => {
        console.error(`[UserService.MergeDatiUtente] Errore CRITICO durante il recupero o merge per UID ${uid}:`, error);
        const fallbackUser: User = {
            ...userFromAuth,
            displayName: userFromAuth.displayName || 'Utente (errore db)',
            photoURL: userFromAuth.photoURL || 'assets/images/default-avatar.png',
            emailVerified: userFromAuth.emailVerified || false,
            ruolo: 'cliente',
        };
        console.warn(`[UserService.MergeDatiUtente] Restituzione utente di fallback a causa di errore:`, JSON.parse(JSON.stringify(fallbackUser)));
        return of(fallbackUser);
      })
    );
  }

Searchuser(uid: string): Observable<User | null> {
  return this.getFFUser(uid).pipe(
    map(firestoreUser => firestoreUser)
  );
}

  updateUserInfo(localId: string, value: Partial<User>): Observable<void> {
    const updateData = Object.entries(value).reduce((acc, [key, val]) => {
      if (val !== undefined) {
        acc[key] = val;
      }
      return acc;
    }, {});
    if (Object.keys(updateData).length === 0) {
      return of(undefined);
    }
    return from(this.afs.doc<User>(`users/${localId}`).update(updateData));
  }
}
