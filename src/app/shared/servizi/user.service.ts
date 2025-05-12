import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/compat/firestore';
import { User } from '../models/user.interface';
import { Store } from '@ngrx/store';
import { AppState } from '../app.state';
import { from } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(
    private readonly afs: AngularFirestore,
    private readonly store: Store<AppState>
  ) {}

  /* Impostazione dei dati utente quando si accede con nome utente/password,
  registrati con username/password e accedi con social auth
  provider nel database Firestore utilizzando il servizio AngularFirestore + AngularFirestoreDocument */
  SetUserData(user: User) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users/${user.localId}`
    );
    const userData: User = {
      email: user.email,
      token: user.token,
      localId: user.localId,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
    return userRef.set(userData, {
      merge: true,
    });
  }

  getFFList() {
    return this.afs.collection('users').snapshotChanges();
  }

  getFFUser(uid: string) {
    return new Promise<any>((resolve) => {
      this.afs
        .collection('users', (ref) => ref.where('localId', '==', uid))
        .valueChanges()
        .subscribe((users) => resolve(users));
    });
  }

  updateUserInfo(_id: string, value: User) {
   return from(this.afs.doc(`users/${_id}`).update(value));
  }

  // formatUser(data: User): User {
  //   const now = new Date();
  //   return {

  //   };
  // }

  async MergeDatiUtente(uid: string, m2: User): Promise<User> {
    let m1 = await this.getFFUser(uid);
    m1 = m1.reduce((acc, it) => [...acc, ...it]);
    const user: User = {
      email: m2.email,
      token: m2.token,
      localId: m2.localId,
      expirationDate: m2.expirationDate,
      displayName: m1.displayName,
      photoURL: m1.photoURL,
      emailVerified: m1.emailVerified,
    };
    return user;
  }

  async Searchuser(uid: string): Promise<User> {
    let userS = await this.getFFUser(uid);
    userS = userS.reduce((acc, it) => [...acc, ...it]);
    return userS;
  }
}
