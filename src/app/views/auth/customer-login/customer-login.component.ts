import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from 'src/app/shared/app.state';
import { getErrorMessage, getLoading } from 'src/app/shared/store/shared.selectors';
import { setLoadingSpinner, setErrorMessage }  from 'src/app/shared/store/shared.actions';
import { loginStart } from '../state/auth.action';

 @Component({
selector: 'app-customer-login',
templateUrl: './customer-login.component.html',
// styleUrls: ['./customer-login.component.scss'] // Aggiungi se hai stili specifici
})
export class CustomerLoginComponent implements OnInit {
loginForm: FormGroup;
errorMessage$: Observable<string | null>;
showLoading$: Observable<boolean>;
constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required]),
    });
    this.errorMessage$ = this.store.select(getErrorMessage);
    this.showLoading$ = this.store.select(getLoading);
    // Pulisce eventuali messaggi di errore precedenti quando il componente viene caricato
    this.store.dispatch(setErrorMessage({ message: null }));
  }

  onLoginSubmit(): void {
    if (!this.loginForm.valid) {
      this.loginForm.markAllAsTouched(); // Mostra errori se il form non è valido
      return;
    }
    const email = this.loginForm.value.email;
    const password = this.loginForm.value.password;
    this.store.dispatch(setLoadingSpinner({ status: true }));
    this.store.dispatch(loginStart({ email, password, isCustomerLogin: true })); // Aggiungiamo un flag
  }
}
