import { Component, OnInit, OnDestroy } from '@angular/core';
import { User } from 'src/app/shared/models/user.interface';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/shared/app.state';
import { Observable, of, Subscription, take } from 'rxjs';
import { getUser, getUserToken } from '../../auth/state/auth.selector';
import { UserService } from 'src/app/shared/servizi/user.service';
import {
  changeInfoStart,
  changeInfoSuccess,
  changePasswordStart,
  changePasswordSuccess,
} from '../../auth/state/auth.action';
import {
  setErrorMessage,
  setLoadingSpinner,
} from 'src/app/shared/store/shared.actions';
import { getErrorMessage } from 'src/app/shared/store/shared.selectors';
import { AuthService } from 'src/app/shared/servizi/auth.service';
import Swal from 'sweetalert2';
import { Actions, ofType } from '@ngrx/effects'

@Component({
  selector: 'app-profilo',
  templateUrl: './profilo.component.html',
  styleUrls: ['./profilo.component.scss'],
})
export class ProfiloComponent implements OnInit, OnDestroy {
  connectedUser$: Observable<User | null> = this.store.select(getUser);
  errorMessage$: Observable<string | null> = this.store.select(getErrorMessage);
  localId: string = '';
  emailVerifiedForm: boolean = false;
  ffuser: User | null = null;
  userForm: FormGroup;

  showUnsavedChangesWarning = false;
  private formChangesSubscription: Subscription | undefined;
  private actionsSubscription: Subscription | undefined;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly store: Store<AppState>,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly actions$: Actions
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.localId = idParam;
        this.loadUserDataAndInitializeForm(this.localId);
      } else {
        console.error("ID utente non trovato nei parametri della rotta.");
        Swal.fire('Errore', 'ID utente mancante nella rotta.', 'error');
        this.router.navigate(['/admin/utente/utenti']);
      }
    });

    this.actionsSubscription = this.actions$.pipe(
      ofType(changeInfoSuccess, changePasswordSuccess)
    ).subscribe(() => {
      if (this.userForm) {
        this.userForm.markAsPristine();
        this.updateWarningState();
      }
    });
  }

  loadUserDataAndInitializeForm(userId: string): void {
    this.userService.Searchuser(userId).pipe(take(1)).subscribe({
      next: (firestoreUser) => {
        if (firestoreUser) {
          this.ffuser = firestoreUser;
          this.emailVerifiedForm = firestoreUser.emailVerified || false;
          this.initializeForm(firestoreUser);
        } else {
          console.error(`Utente con ID ${userId} non trovato in Firestore.`);
          Swal.fire('Errore', 'Utente non trovato.', 'error')
            .then(() => this.router.navigate(['/admin/utente/utenti']));
        }
      },
      error: (err) => {
        console.error('Errore nel caricamento dati utente da Firestore:', err);
        Swal.fire('Errore Server', 'Impossibile caricare i dati utente.', 'error')
          .then(() => this.router.navigate(['/admin/utente/utenti']));
      }
    });
  }

  initializeForm(userData: User): void {
    this.userForm = new FormGroup({
      displayName: new FormControl(userData.displayName || '', [
        Validators.required,
        Validators.minLength(6),
      ]),
      email: new FormControl({value: userData.email || '', disabled: true}, [Validators.required, Validators.email]),
      cellulare: new FormControl(userData.cellulare || '', [
        Validators.minLength(10),
      ]),
      indirizzo: new FormControl({ value: (userData as any).indirizzo || '', disabled: true }),
      emailverified: new FormControl({ value: userData.emailVerified || false, disabled: true }),
      isAdminRole: new FormControl(userData.ruolo === 'admin'),
      passwordold: new FormControl('', [Validators.minLength(6)]),
      passwordnew: new FormControl('', [
        Validators.minLength(8),
        Validators.pattern(
          /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*#?&^_-]).{8,}/
        ),
      ]),
      passwordnewre: new FormControl('', [
        Validators.minLength(8),
      ]),
    }, { validators: this.passwordMatchValidator });

    if (this.formChangesSubscription) {
      this.formChangesSubscription.unsubscribe();
    }
    this.formChangesSubscription = this.userForm.valueChanges.subscribe(() => {
      this.updateWarningState();
    });
    this.updateWarningState();
  }

  updateWarningState(): void {
    if (this.userForm && this.userForm.dirty) {
      this.showUnsavedChangesWarning = true;
    } else {
      this.showUnsavedChangesWarning = false;
    }
  }

  passwordMatchValidator(fg: FormGroup): {[key: string]: boolean} | null {
    const newPass = fg.get('passwordnew')?.value;
    const confirmPass = fg.get('passwordnewre')?.value;

    if (newPass || confirmPass) {
        if (newPass !== confirmPass) {
            fg.get('passwordnewre')?.setErrors({ mismatch: true });
            return { 'mismatch': true };
        } else {
            const confirmPassControl = fg.get('passwordnewre');
            if (confirmPassControl && confirmPassControl.hasError('mismatch')) {
                confirmPassControl.setErrors(null);
            }
        }
    } else {
        const confirmPassControl = fg.get('passwordnewre');
        if (confirmPassControl && confirmPassControl.hasError('mismatch')) {
            confirmPassControl.setErrors(null);
        }
    }
    return null;
  }


  onRoleChange(event: Event): void {
    // Logica aggiuntiva se necessaria, altrimenti il form binding è sufficiente
  }

  onSubmit(event: Event) {
    const submitEvent = event as SubmitEvent;
    const submitter = submitEvent.submitter as HTMLButtonElement | null;

    if (submitter && submitter.name === 'changePassword') {
      const newPassControl = this.userForm.get('passwordnew');
      const newRePassControl = this.userForm.get('passwordnewre');
      newPassControl?.markAsTouched();
      newRePassControl?.markAsTouched();
      newPassControl?.updateValueAndValidity();
      newRePassControl?.updateValueAndValidity();

      if (newPassControl?.invalid || newRePassControl?.invalid || (this.userForm.errors && this.userForm.errors['mismatch'])) {
         Swal.fire('Attenzione', 'Correggi gli errori nel form della password.', 'warning');
         this.store.dispatch(setLoadingSpinner({ status: false }));
         return;
      }
       if (!newPassControl?.value && !newRePassControl?.value) {
         Swal.fire('Info', 'Nessuna nuova password inserita.', 'info');
         this.store.dispatch(setLoadingSpinner({ status: false }));
         return;
      }
    } else if (submitter && submitter.name === 'changeUser') {
        const profileControls = ['displayName', 'cellulare', 'isAdminRole'];
        let profileFormValid = true;
        profileControls.forEach(controlName => {
            const control = this.userForm.get(controlName);
            control?.markAsTouched();
            if (control?.invalid) {
                profileFormValid = false;
            }
        });
        if (!profileFormValid) {
            Swal.fire('Attenzione', 'Correggi gli errori nei dati del profilo.', 'warning');
            this.store.dispatch(setLoadingSpinner({ status: false }));
            return;
        }
    }


    if (!this.userForm.valid && !(submitter && submitter.name === 'changeUser' && !this.userForm.get('passwordnew')?.value && !this.userForm.get('passwordnewre')?.value) ) {
        this.userForm.markAllAsTouched();
        Swal.fire('Attenzione', 'Per favore, correggi gli errori nel form.', 'warning');
        this.store.dispatch(setLoadingSpinner({ status: false }));
        return;
    }


    if (!this.ffuser || !this.localId) {
        Swal.fire('Errore', 'Dati utente non caricati correttamente.', 'error');
        this.store.dispatch(setLoadingSpinner({ status: false }));
        return;
    }

    this.store.dispatch(setLoadingSpinner({ status: true }));

    if (submitter && submitter.name === 'changePassword') {
      const passwordNew = this.userForm.value.passwordnew;

      this.store.select(getUserToken).pipe(take(1)).subscribe(token => {
          if (token) {
             this.store.dispatch(changePasswordStart({ idToken: token, password: passwordNew }));
          } else {
             this.store.dispatch(setErrorMessage({ message: 'Token utente non valido per cambio password.' }));
             this.store.dispatch(setLoadingSpinner({ status: false }));
          }
      });

    } else if (submitter && submitter.name === 'changeUser') {
      const displayName: string = this.userForm.value.displayName;
      const cellulare: string = this.userForm.value.cellulare;
      const isAdminRole: boolean = this.userForm.value.isAdminRole;
      const newRole = isAdminRole ? 'admin' : 'cliente';

      const updatedUserData: Partial<User> = {
        displayName: displayName,
        cellulare: cellulare,
        ruolo: newRole,
        photoURL: this.ffuser?.photoURL,
        email: this.ffuser?.email,
        emailVerified: this.ffuser?.emailVerified
      };

      this.store.dispatch(changeInfoStart({ localId: this.localId, value: updatedUserData as User }));
    } else {
      console.warn("Azione di submit non riconosciuta o submitter non trovato.");
      this.store.dispatch(setLoadingSpinner({ status: false }));
    }
  }

  ngOnDestroy(): void {
    if (this.formChangesSubscription) {
      this.formChangesSubscription.unsubscribe();
    }
    if (this.actionsSubscription) {
      this.actionsSubscription.unsubscribe();
    }
  }
}
