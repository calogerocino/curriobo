import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/shared/models/user.interface';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/shared/app.state';
import { Observable } from 'rxjs';
import { getUser } from '../../auth/state/auth.selector';
import { UserService } from 'src/app/shared/servizi/user.service';
import {
  changeInfoStart,
  changePasswordStart,
} from '../../auth/state/auth.action';
import {
  setErrorMessage,
  setLoadingSpinner,
} from 'src/app/shared/store/shared.actions';
import { getErrorMessage } from 'src/app/shared/store/shared.selectors';
import { AuthService } from 'src/app/shared/servizi/auth.service';

@Component({
  selector: 'app-profilo',
  templateUrl: './profilo.component.html',
  styleUrls: ['./profilo.component.scss'],
})
export class ProfiloComponent implements OnInit {
  connectedUser$: Observable<User> = this.store.select(getUser);
  errorMessage$: Observable<string | null> = this.store.select(getErrorMessage);
  localId: string = '';
  emailVerifiedForm: boolean = false;
  ffuser: any;
  user: User;
  userForm: FormGroup;
  passwordForm: FormGroup;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly store: Store<AppState>,
    private readonly userService: UserService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.localId = params.get('id');
      this.getDatiUtenteID(this.localId);
    });
  }

  createFormUser(
    DisplayName: string,
    Email: string,
    Cellulare: string,
    EmailVerified: boolean,
    Indirizzo: string
  ) {
    this.userForm = new FormGroup({
      displayName: new FormControl(DisplayName, [
        Validators.required,
        Validators.minLength(6),
      ]),
      email: new FormControl(Email, [Validators.required, Validators.email]),
      cellulare: new FormControl(Cellulare, [
        Validators.required,
        Validators.minLength(10),
      ]),
      indirizzo: new FormControl({ value: Indirizzo, disabled: true }),
      emailverified: new FormControl({ value: EmailVerified, disabled: true }),
      //PASSWORD
      passwordold: new FormControl('', [Validators.minLength(10)]),
      passwordnew: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(
          /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*#?&^_-]).{8,}/
        ),
      ]),
      passwordnewre: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(
          /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*#?&^_-]).{8,}/
        ),
      ]),
    });
  }

  async getDatiUtenteID(idu: string) {
    this.ffuser = await this.userService.Searchuser(idu);
    this.emailVerifiedForm = this.ffuser.emailVerified;
    this.createFormUser(
      this.ffuser.displayName,
      this.ffuser.email,
      this.ffuser.cellulare,
      this.ffuser.emailVerified,
      ''
    );
  }

  onSubmit(event) {
    const password: string = this.userForm.value.passwordnew;
    const passwordnewre: string = this.userForm.value.passwordnewre;
    const displayName: string = this.userForm.value.displayName;
    const email: string = this.userForm.value.email;
    const cellulare: string = this.userForm.value.cellulare;
    const localId = this.localId;
    let photoURL: string = '';
    let idToken: string = '';
    let emailVerified: boolean = false;
    this.connectedUser$.subscribe(
      (data) => ((idToken = data.token), (photoURL = data.photoURL))
    );

    if (event.submitter.name == 'changePassword') {
      if (password == passwordnewre) {
        this.store.dispatch(setLoadingSpinner({ status: true }));
        this.store.dispatch(changePasswordStart({ idToken, password }));
      } else {
        const ErrorMessage = this.authService.getErrorMessage(
          'NOT_MATCHES_PASSWORD'
        );
        this.store.dispatch(setErrorMessage({ message: ErrorMessage }));
        this.store.dispatch(setLoadingSpinner({ status: false }));
      }
    } else {
      if (displayName != '' || email != '') {
        const value: User = {
          email: email,
          token: idToken,
          localId: localId,
          displayName: displayName,
          photoURL: photoURL,
          ruolo: 'admin',
          emailVerified: emailVerified,
          cellulare: cellulare,
        };
        this.store.dispatch(setLoadingSpinner({ status: true }));
        this.store.dispatch(changeInfoStart({ localId, value }));
      }
    }
  }
}
