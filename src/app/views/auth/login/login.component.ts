import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../shared/servizi/auth.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/shared/app.state';
import { autoLogin, loginStart } from '../state/auth.action';
import { setLoadingSpinner } from 'src/app/shared/store/shared.actions';
import { Observable } from 'rxjs';
import { getErrorMessage } from 'src/app/shared/store/shared.selectors';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage$: Observable<string | null> = this.store.select(getErrorMessage);

  constructor(
    private readonly authService: AuthService,
    private readonly store: Store<AppState>
  ) {}

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required]),
    });
    this.store.dispatch(autoLogin())
  }

  googleAuth() {
    this.authService.GoogleAuth();
  }

  onLoginSubmit() {
    const email = this.loginForm.value.email;
    const password = this.loginForm.value.password;
    this.store.dispatch(setLoadingSpinner({ status: true }));
    this.store.dispatch(loginStart({ email, password }));
  }
}
