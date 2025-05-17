
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, take, tap } from 'rxjs/operators';
import { AppState } from 'src/app/shared/app.state';
import { User } from 'src/app/shared/models/user.interface';
import { getUser, getUserToken, isAuthenticated } from 'src/app/views/auth/state/auth.selector';
import { changeInfoStart, changePasswordStart, updateLogin, changeInfoSuccess, changePasswordSuccess } from 'src/app/views/auth/state/auth.action'; // Assicurati che changeInfoSuccess e changePasswordSuccess siano importati
import { setLoadingSpinner, setErrorMessage } from 'src/app/shared/store/shared.actions';
import Swal from 'sweetalert2';
import { Actions, ofType } from '@ngrx/effects';
import { getErrorMessage, getLoading } from 'src/app/shared/store/shared.selectors';

@Component({
  selector: 'app-account-info',
  templateUrl: './account-info.component.html',
  styleUrls: ['./account-info.component.scss']
})
export class AccountInfoComponent implements OnInit, OnDestroy {
  currentUser$: Observable<User | null> = this.store.select(getUser);
  errorMessage$: Observable<string | null> = this.store.select(getErrorMessage);
  accountForm: FormGroup;
  passwordForm: FormGroup;

  isSubmitting$: Observable<boolean>;

  private subscriptions: Subscription = new Subscription();
  private localId: string | undefined;
  showUnsavedChangesWarning = false;
  isLoadingAccount = true;
  isLoadingPassword = false;

  constructor(
    private fb: FormBuilder,
    private store: Store<AppState>,
    private actions$: Actions
  ) {
    this.isSubmitting$ = this.store.select(getLoading);
  }

  ngOnInit(): void {
    this.initForms();
    this.loadUserData();
    this.subscribeToFormChanges();
    this.subscribeToSuccessActions();
  }

  private initForms(): void {
    this.accountForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(3)]],
      cellulare: ['', [Validators.minLength(9), Validators.maxLength(15), Validators.pattern('^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\\s\\./0-9]*$')]],
      photoURL: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: [''],
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*#?&^_-]).{8,}/)]],
      confirmNewPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  private loadUserData(): void {
    const userSub = this.currentUser$.pipe(
      filter(user => !!user),
      take(1)
    ).subscribe(user => {
      if (user) {
        this.localId = user.localId;
        this.accountForm.patchValue({
          displayName: user.displayName,
          cellulare: user.cellulare,
          photoURL: user.photoURL
        });
        this.accountForm.markAsPristine();
        this.isLoadingAccount = false;
        this.updateWarningState();
      } else {
        this.isLoadingAccount = false;
        this.store.dispatch(setErrorMessage({ message: 'Dati utente non disponibili.' }));
      }
    });
    this.subscriptions.add(userSub);
  }

  private subscribeToFormChanges(): void {
    const accountFormSub = this.accountForm.valueChanges.subscribe(() => this.updateWarningState());
    const passwordFormSub = this.passwordForm.valueChanges.subscribe(() => this.updateWarningState());
    this.subscriptions.add(accountFormSub);
    this.subscriptions.add(passwordFormSub);
  }

  private subscribeToSuccessActions(): void {
    const successSub = this.actions$.pipe(
      ofType(changeInfoSuccess, changePasswordSuccess)
    ).subscribe(() => {
      this.accountForm.markAsPristine();
      this.passwordForm.markAsPristine();
      this.passwordForm.reset();
      this.updateWarningState();
      this.store.dispatch(updateLogin({redirect: false, isCustomerLogin: true }));
    });
    this.subscriptions.add(successSub);
  }

  updateWarningState(): void {
    this.showUnsavedChangesWarning = (this.accountForm && this.accountForm.dirty) || (this.passwordForm && this.passwordForm.dirty);
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const newPass = group.get('newPassword')?.value;
    const confirmPass = group.get('confirmNewPassword')?.value;
    if (newPass && confirmPass && newPass !== confirmPass) {
      group.get('confirmNewPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    const confirmCtrl = group.get('confirmNewPassword');
    if (confirmCtrl && confirmCtrl.hasError('mismatch') && (newPass === confirmPass || !confirmPass)) {
        confirmCtrl.setErrors(null);
    }
    return null;
  }

  onUpdateAccount(): void {
    if (!this.accountForm.valid || !this.localId) {
      this.accountForm.markAllAsTouched();
      Swal.fire('Attenzione', 'Correggi gli errori nel form del profilo.', 'warning');
      return;
    }
    this.store.dispatch(setLoadingSpinner({ status: true }));

    const updatedUserInfo: Partial<User> = {
      displayName: this.accountForm.value.displayName,
      cellulare: this.accountForm.value.cellulare,
      photoURL: this.accountForm.value.photoURL || undefined
    };
    this.store.dispatch(changeInfoStart({ localId: this.localId, value: updatedUserInfo as User }));
  }

  onUpdatePassword(): void {
    if (!this.passwordForm.valid) {
      this.passwordForm.markAllAsTouched();
      Swal.fire('Attenzione', 'Correggi gli errori nel form della password.', 'warning');
      return;
    }


    this.store.dispatch(setLoadingSpinner({ status: true }));

    const tokenSub = this.store.select(getUserToken).pipe(take(1)).subscribe(token => {
      if (token) {
        this.store.dispatch(changePasswordStart({ idToken: token, password: this.passwordForm.value.newPassword }));
      } else {
        this.store.dispatch(setErrorMessage({ message: 'Token utente non valido. Riprova il login.' }));
        this.store.dispatch(setLoadingSpinner({ status: false }));
        Swal.fire('Errore', 'Sessione scaduta o non valida. Effettua nuovamente il login.', 'error');
      }
    });
    this.subscriptions.add(tokenSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
