import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../models/user.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  APIKey = 'AIzaSyA6ArV7B4vQOTu-aGj9gOuAfYN63DrhC0Q';
  isLoggedIn: boolean;
  isAdmin = true;
  signUpURL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${this.APIKey}`;
  signInURL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${this.APIKey}`;
  user: User;
  constructor(private readonly http: HttpClient) {}


  isAuthenticated() {
    return this.isLoggedIn;
  }

  isRoleAdmin() {
    return this.isAdmin;
  }

  createUser(email: string, localId: string, token: string, expirationDate: Date): User {
    this.isLoggedIn = true;
    return {
      email,
      localId,
      token,
      expirationDate
    };
  }

  signUp(email: string, password: string) {
    return this.http.post(this.signUpURL, {
      email: email,
      password: password,
      returnSecureToken: true,
    });
  }

  signIn(email: string, password: string) {
    return this.http.post(this.signInURL, {
      email: email,
      password: password,
      returnSecureToken: true,
    });
  }

}
