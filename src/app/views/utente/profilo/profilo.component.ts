import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { User } from 'src/app/shared/models/user.interface';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/shared/app.state';
import { firstValueFrom, Observable, of, Subscription } from 'rxjs';
import { filter, map, take, tap } from 'rxjs/operators';
import { getUser, getUserToken } from '../../auth/state/auth.selector';
import { UserService } from 'src/app/shared/servizi/user.service';
import {
  changeInfoStart,
  changeInfoSuccess,
  changePasswordStart,
  changePasswordSuccess,
  updateLogin,
} from '../../auth/state/auth.action';
import {
  setErrorMessage,
  setLoadingSpinner,
} from 'src/app/shared/store/shared.actions';
import { getErrorMessage, getLoading } from 'src/app/shared/store/shared.selectors';
import { AuthService } from 'src/app/shared/servizi/auth.service';
import Swal from 'sweetalert2';
import { Actions, ofType } from '@ngrx/effects';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';

@Component({
  selector: 'app-profilo',
  templateUrl: './profilo.component.html',
  styleUrls: ['./profilo.component.scss'],
})
export class ProfiloComponent implements OnInit, OnDestroy {
  connectedUser$: Observable<User | null> = this.store.select(getUser);
  errorMessage$: Observable<string | null> = this.store.select(getErrorMessage);
  isLoading$: Observable<boolean> = this.store.select(getLoading);

  localId: string = '';
  emailVerifiedForm: boolean = false;
  ffuser: User | null = null;
  userForm: FormGroup;

  showUnsavedChangesWarning = false;
  private formChangesSubscription: Subscription | undefined;
  private actionsSubscription: Subscription | undefined;
  private routeParamsSubscription: Subscription | undefined;
  private loggedInUserSubscription: Subscription | undefined;


  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  isUploading: boolean = false;

  isCurrentUserAdmin: boolean = false;
  isViewingOwnProfile: boolean = false;
  private loggedInUserId: string | undefined;
  initialLoading: boolean = true;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly store: Store<AppState>,
    private readonly userService: UserService,
    public readonly authService: AuthService,
    private readonly actions$: Actions,
    @Inject(Storage) private readonly storage: Storage
  ) {}

  ngOnInit(): void {
    this.initialLoading = true;
    this.store.dispatch(setLoadingSpinner({ status: true }));

    this.loggedInUserSubscription = this.store.select(getUser).pipe(take(1)).subscribe(loggedInUser => {
      if (loggedInUser && loggedInUser.localId) {
        this.loggedInUserId = loggedInUser.localId;
        this.isCurrentUserAdmin = loggedInUser.ruolo === 'admin';

        this.routeParamsSubscription = this.route.paramMap.subscribe(params => {
          const idParam = params.get('id');
          if (idParam) {
            this.localId = idParam;
            this.isViewingOwnProfile = this.loggedInUserId === this.localId;
          } else {
            this.localId = this.loggedInUserId!;
            this.isViewingOwnProfile = true;
          }
          this.loadUserDataAndInitializeForm(this.localId);
        });
      } else {
        console.error("Utente non loggato che tenta di accedere al profilo o ID utente loggato non disponibile.");
        this.router.navigate(['/auth/login']);
        this.initialLoading = false;
        this.store.dispatch(setLoadingSpinner({ status: false }));
      }
    });
    this.actionsSubscription = this.actions$.pipe(
      ofType(changeInfoSuccess, changePasswordSuccess)
    ).subscribe(() => {
      if (this.userForm) {
        this.userForm.markAsPristine();
        this.selectedFile = null;
        this.updateWarningState();
        if (this.localId) {
          this.loadUserDataAndInitializeForm(this.localId, false);
        }
      }
    });
  }

  loadUserDataAndInitializeForm(userId: string, reinitializeFullForm: boolean = true): void {
    if (!userId) {
      console.error("ID utente non valido per il caricamento dei dati.");
      this.initialLoading = false;
      this.store.dispatch(setLoadingSpinner({ status: false }));
      Swal.fire('Errore', 'ID utente mancante.', 'error');
      this.router.navigate([this.isCurrentUserAdmin ? '/admin/utente/utenti' : '/cliente/dashboard']);
      return;
    }

    this.userService.Searchuser(userId).pipe(take(1)).subscribe({
      next: (firestoreUser) => {
        if (firestoreUser) {
          this.ffuser = firestoreUser;
          this.emailVerifiedForm = firestoreUser.emailVerified || false;
          if (reinitializeFullForm || !this.userForm) {
            this.initializeForm(firestoreUser);
          } else {
            this.userForm.patchValue({
                displayName: firestoreUser.displayName || '',
                cellulare: firestoreUser.cellulare || '',
            }, { emitEvent: false });
            this.imagePreview = firestoreUser.photoURL || this.authService.DEFAULT_AVATAR_URL;
            this.userForm.markAsPristine();
            this.updateWarningState();
          }
        } else {
          console.error(`Utente con ID ${userId} non trovato in Firestore.`);
          Swal.fire('Errore', 'Utente non trovato.', 'error')
            .then(() => this.router.navigate([this.isCurrentUserAdmin ? '/admin/utente/utenti' : '/cliente/dashboard']));
        }
        this.initialLoading = false;
        this.store.dispatch(setLoadingSpinner({ status: false }));
      },
      error: (err) => {
        console.error('Errore nel caricamento dati utente da Firestore:', err);
        Swal.fire('Errore Server', 'Impossibile caricare i dati utente.', 'error')
          .then(() => this.router.navigate([this.isCurrentUserAdmin ? '/admin/utente/utenti' : '/cliente/dashboard']));
        this.initialLoading = false;
        this.store.dispatch(setLoadingSpinner({ status: false }));
      }
    });
  }

  initializeForm(userData: User): void {
    this.userForm = new FormGroup({
      displayName: new FormControl(userData.displayName || '', [
        Validators.required,
        Validators.minLength(3),
      ]),
      email: new FormControl({value: userData.email || '', disabled: true}, [Validators.required, Validators.email]),
      cellulare: new FormControl(userData.cellulare || '', [
        Validators.pattern('^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\\s\\./0-9]*$'),
        Validators.minLength(9)
      ]),
      emailverified: new FormControl(
        {
          value: userData.emailVerified || false,
          disabled: !this.isCurrentUserAdmin || this.isViewingOwnProfile
        }
      ),
      isAdminRole: new FormControl(
        {
          value: userData.ruolo === 'admin',
          disabled: !this.isCurrentUserAdmin || this.isViewingOwnProfile
        }
      ),
      passwordnew: new FormControl('', this.isViewingOwnProfile ? [
        Validators.minLength(8),
        Validators.pattern(
          /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*#?&^_-]).{8,}/
        ),
      ] : []),
      passwordnewre: new FormControl('', this.isViewingOwnProfile ? [] : []),
    }, { validators: this.isViewingOwnProfile ? this.passwordMatchValidator : null });

    this.imagePreview = userData.photoURL || this.authService.DEFAULT_AVATAR_URL;

    if (this.formChangesSubscription) {
      this.formChangesSubscription.unsubscribe();
    }
    this.formChangesSubscription = this.userForm.valueChanges.subscribe(() => {
      this.updateWarningState();
    });
    this.updateWarningState();
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList && fileList[0]) {
      const file = fileList[0];
      const allowedTypes = ['image/png', 'image/jpeg', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire('Errore', 'Formato file non supportato. Seleziona PNG, JPG o GIF.', 'error');
        this.selectedFile = null;
        this.imagePreview = this.ffuser?.photoURL || this.authService.DEFAULT_AVATAR_URL;
        element.value = "";
        return;
      }
      const maxSizeInBytes = 2 * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        Swal.fire('Errore', 'File troppo grande. Dimensione massima 2MB.', 'error');
        this.selectedFile = null;
        this.imagePreview = this.ffuser?.photoURL || this.authService.DEFAULT_AVATAR_URL;
        element.value = "";
        return;
      }

      this.selectedFile = file;
      this.userForm.markAsDirty();
      this.updateWarningState();
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(this.selectedFile);
    } else {
      this.selectedFile = null;
    }
  }

  updateWarningState(): void {
    if (this.userForm) {
      this.showUnsavedChangesWarning = this.userForm.dirty || !!this.selectedFile;
    } else {
      this.showUnsavedChangesWarning = !!this.selectedFile;
    }
  }

  passwordMatchValidator(fg: FormGroup): {[key: string]: boolean} | null {
    const newPassControl = fg.get('passwordnew');
    const confirmPassControl = fg.get('passwordnewre');

    if (newPassControl && confirmPassControl) {
        const newPass = newPassControl.value;
        const confirmPass = confirmPassControl.value;
        if (newPass || confirmPass) {
            if (newPass !== confirmPass) {
                confirmPassControl.setErrors({ mismatch: true });
                return { 'mismatch': true };
            } else {
                if (confirmPassControl.hasError('mismatch')) {
                    const errors = confirmPassControl.errors;
                    if (errors) {
                        delete errors['mismatch'];
                        if (Object.keys(errors).length === 0) {
                            confirmPassControl.setErrors(null);
                        } else {
                            confirmPassControl.setErrors(errors);
                        }
                    }
                }
            }
        } else {
             if (confirmPassControl.hasError('mismatch')) {
                confirmPassControl.setErrors(null);
            }
        }
    }
    return null;
  }

  onRoleChange(event: Event): void {
    this.userForm.markAsDirty();
    this.updateWarningState();
  }

  async onSubmit(event: Event) {
    const submitEvent = event as SubmitEvent;
    const submitter = submitEvent.submitter as HTMLButtonElement | null;

    if (this.initialLoading || (this.isLoading$ && await firstValueFrom(this.isLoading$))) {
        Swal.fire('Attendi', 'Operazione precedente in corso.', 'info');
        return;
    }

    if (submitter && submitter.name === 'changePassword') {
        if (!this.isViewingOwnProfile) {
            Swal.fire('Errore', 'Non puoi cambiare la password di un altro utente da qui.', 'error');
            return;
        }
        const newPassControl = this.userForm.get('passwordnew');
        const newRePassControl = this.userForm.get('passwordnewre');

        newPassControl?.markAsTouched();
        newRePassControl?.markAsTouched();
        newPassControl?.updateValueAndValidity({ onlySelf: true });
        this.userForm.updateValueAndValidity();
        if (!newPassControl?.value && !newRePassControl?.value) {
            Swal.fire('Info', 'Nessuna nuova password inserita. Nessuna modifica apportata alla password.', 'info');
            return;
        }

        if (newPassControl?.invalid || this.userForm.hasError('mismatch') || newRePassControl?.invalid) {
            Swal.fire('Attenzione', 'Correggi gli errori nel form della password.', 'warning');
            return;
        }

        this.store.dispatch(setLoadingSpinner({ status: true }));
        const passwordNew = this.userForm.value.passwordnew;

        this.store.select(getUserToken).pipe(take(1)).subscribe(token => {
            if (token) {
                this.store.dispatch(changePasswordStart({ idToken: token, password: passwordNew }));
            } else {
                this.store.dispatch(setErrorMessage({ message: 'Token utente non valido per cambio password.' }));
                this.store.dispatch(setLoadingSpinner({ status: false }));
                 Swal.fire('Errore Sessione', 'Token utente non valido. Effettua nuovamente il login.', 'error');
            }
        });

    } else if (submitter && submitter.name === 'changeUser') {
        const profileControlsToValidate = ['displayName', 'cellulare'];
        let isProfileSectionValid = true;
        profileControlsToValidate.forEach(controlName => {
            const control = this.userForm.get(controlName);
            control?.markAsTouched();
            if (control?.invalid) {
                isProfileSectionValid = false;
            }
        });
        if (this.isCurrentUserAdmin && !this.isViewingOwnProfile) {
            const adminRoleControl = this.userForm.get('isAdminRole');
            const emailVerifiedControl = this.userForm.get('emailverified');
            adminRoleControl?.markAsTouched();
            emailVerifiedControl?.markAsTouched();
            if (adminRoleControl?.invalid || emailVerifiedControl?.invalid) {
                isProfileSectionValid = false;
            }
        }

        if (!isProfileSectionValid) {
            Swal.fire('Attenzione', 'Correggi gli errori nei dati del profilo.', 'warning');
            return;
        }

        if (!this.ffuser || !this.localId) {
            Swal.fire('Errore', 'Dati utente di riferimento non caricati correttamente.', 'error');
            return;
        }

        if (!this.userForm.dirty && !this.selectedFile) {
            Swal.fire('Info', 'Nessuna modifica da salvare.', 'info');
            return;
        }

        this.store.dispatch(setLoadingSpinner({ status: true }));
        this.isUploading = true;

        let photoURLPromise: Promise<string | undefined>;

        if (this.selectedFile) {
            const filePath = `profile-pictures/${this.localId}/${Date.now()}_${this.selectedFile.name}`;
            const storageRef = ref(this.storage, filePath);
            const uploadTask = uploadBytesResumable(storageRef, this.selectedFile);

            photoURLPromise = new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {  },
                (error) => {
                console.error("Errore durante l'upload dell'immagine:", error);
                Swal.fire('Errore Upload', "Impossibile caricare l'immagine.", 'error');
                reject(error);
                },
                async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                } catch (urlError) {
                    reject(urlError);
                }
                }
            );
            });
        } else {
            photoURLPromise = Promise.resolve(this.ffuser?.photoURL);
        }

        try {
            const newPhotoURL = await photoURLPromise;

            const displayName: string = this.userForm.value.displayName;
            const cellulare: string = this.userForm.value.cellulare;

            const updatedUserData: Partial<User> = {
                displayName: displayName,
                cellulare: cellulare,
                photoURL: newPhotoURL
            };

            if (this.isCurrentUserAdmin && !this.isViewingOwnProfile) {
                updatedUserData.ruolo = this.userForm.value.isAdminRole ? 'admin' : 'cliente';
                updatedUserData.emailVerified = this.userForm.value.emailverified;
            }

            const finalUserData = Object.fromEntries(
                Object.entries(updatedUserData).filter(([, v]) => v !== undefined && v !== null)
            ) as User;

            this.store.dispatch(changeInfoStart({ localId: this.localId!, value: finalUserData }));
        } catch (error) {
            console.error("Errore nel processo di upload o aggiornamento profilo:", error);
            this.store.dispatch(setErrorMessage({ message: "Errore durante l'aggiornamento del profilo." }));
        } finally {
            this.isUploading = false;
        }

    } else {
      console.warn("Azione di submit non riconosciuta o submitter non trovato.");
    }
  }

  ngOnDestroy(): void {
    if (this.formChangesSubscription) this.formChangesSubscription.unsubscribe();
    if (this.actionsSubscription) this.actionsSubscription.unsubscribe();
    if (this.routeParamsSubscription) this.routeParamsSubscription.unsubscribe();
    if (this.loggedInUserSubscription) this.loggedInUserSubscription.unsubscribe();
  }
}
