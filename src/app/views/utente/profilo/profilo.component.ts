import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { User } from 'src/app/shared/models/user.interface';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/shared/app.state';
import { firstValueFrom, Observable, of, Subscription } from 'rxjs';
import { filter, map, take, tap } from 'rxjs/operators'; // Added filter and tap
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
  isLoading$: Observable<boolean> = this.store.select(getLoading); // Used for submit buttons

  localId: string = ''; // ID of the profile being viewed
  emailVerifiedForm: boolean = false;
  ffuser: User | null = null; // User data of the profile being viewed
  userForm: FormGroup;

  showUnsavedChangesWarning = false;
  private formChangesSubscription: Subscription | undefined;
  private actionsSubscription: Subscription | undefined;
  private routeParamsSubscription: Subscription | undefined;
  private loggedInUserSubscription: Subscription | undefined;


  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  isUploading: boolean = false;

  // Flags for conditional UI
  isCurrentUserAdmin: boolean = false;
  isViewingOwnProfile: boolean = false;
  private loggedInUserId: string | undefined;
  initialLoading: boolean = true; // For overall component loading state

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
          if (idParam) { // Admin viewing a specific profile or user viewing own profile via admin route
            this.localId = idParam;
            this.isViewingOwnProfile = this.loggedInUserId === this.localId;
          } else { // Customer viewing their own profile via /cliente/account
            this.localId = this.loggedInUserId!; // Safe due to outer if
            this.isViewingOwnProfile = true;
          }
          this.loadUserDataAndInitializeForm(this.localId);
        });
      } else {
        // Should be caught by AuthGuard, but as a fallback:
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
        this.userForm.markAsPristine(); // Mark form as pristine after successful save
        this.selectedFile = null; // Reset selected file as it has been processed
        this.updateWarningState();
        // Reload data to reflect changes, including photoURL which might come from storage
        if (this.localId) {
          // Re-fetch user data to get the latest, especially photoURL from storage
          this.loadUserDataAndInitializeForm(this.localId, false); // false to not fully re-init form if not needed for image
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
            // Only update relevant parts if not a full reinitialization, e.g., photo
            this.userForm.patchValue({
                displayName: firestoreUser.displayName || '',
                // email: firestoreUser.email || '', // Email non dovrebbe cambiare
                cellulare: firestoreUser.cellulare || '',
                // isAdminRole: firestoreUser.ruolo === 'admin', // Ruolo
                // emailverified: firestoreUser.emailVerified || false // Email verificata
            }, { emitEvent: false }); // emitEvent false per non triggerare valueChanges
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
        Validators.minLength(3), // Adjusted from 6 to 3 for more flexibility
      ]),
      email: new FormControl({value: userData.email || '', disabled: true}, [Validators.required, Validators.email]),
      cellulare: new FormControl(userData.cellulare || '', [
        Validators.pattern('^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\\s\\./0-9]*$'), // Generic phone pattern
        Validators.minLength(9) // Common minimum length
      ]),
      // indirizzo is not in User model, seems to be from an old version or a custom field. Let's remove if not essential or add to model.
      // For now, assume it's not a core field for this unified component.
      // indirizzo: new FormControl({ value: (userData as any).indirizzo || '', disabled: true }),

      // Admin-controlled fields
      emailverified: new FormControl(
        {
          value: userData.emailVerified || false,
          // Email verified can be changed by an admin, but not for their own profile via this UI.
          // Also, a user cannot change their own verification status.
          disabled: !this.isCurrentUserAdmin || this.isViewingOwnProfile
        }
      ),
      isAdminRole: new FormControl(
        {
          value: userData.ruolo === 'admin',
          // Role can be changed by an admin, but not for their own profile.
          disabled: !this.isCurrentUserAdmin || this.isViewingOwnProfile
        }
      ),

      // Password fields - only relevant if isViewingOwnProfile
      // passwordold: new FormControl('', this.isViewingOwnProfile ? [Validators.minLength(6)] : []), // Conditional validator not straightforward here. Handle in template.
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
    this.updateWarningState(); // Initial check
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
      const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSizeInBytes) {
        Swal.fire('Errore', 'File troppo grande. Dimensione massima 2MB.', 'error');
        this.selectedFile = null;
        this.imagePreview = this.ffuser?.photoURL || this.authService.DEFAULT_AVATAR_URL;
        element.value = ""; // Clear the input
        return;
      }

      this.selectedFile = file;
      this.userForm.markAsDirty(); // Mark form as dirty when a new file is selected
      this.updateWarningState();

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(this.selectedFile);
    } else {
      // If no file is selected (e.g., user cancels file dialog), revert to previous or default.
      // This case might not be hit if the change event only fires on actual selection.
      this.selectedFile = null;
      // Do not reset imagePreview here unless it's intended to clear it on cancel.
      // this.imagePreview = this.ffuser?.photoURL || this.authService.DEFAULT_AVATAR_URL;
    }
  }

  updateWarningState(): void {
    if (this.userForm) { // Check if userForm is initialized
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

        // Only validate if newPassword has a value, to allow password fields to be optional if not changing password
        if (newPass || confirmPass) {
            if (newPass !== confirmPass) {
                confirmPassControl.setErrors({ mismatch: true });
                return { 'mismatch': true };
            } else {
                 // Clear mismatch error if passwords match or if one is empty and the other had an error
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
        } else { // If both are empty, clear any previous mismatch error
             if (confirmPassControl.hasError('mismatch')) {
                confirmPassControl.setErrors(null);
            }
        }
    }
    return null;
  }

  onRoleChange(event: Event): void {
    // This method is bound to the (change) event of the role switch.
    // The form control `isAdminRole` is already updated by Angular Forms.
    // No specific action needed here unless there's additional logic on role change itself.
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

        // Mark as touched to show validation errors
        newPassControl?.markAsTouched();
        newRePassControl?.markAsTouched();
        newPassControl?.updateValueAndValidity({ onlySelf: true });
        this.userForm.updateValueAndValidity(); // Re-run form-level validators like passwordMatchValidator

        if (!newPassControl?.value && !newRePassControl?.value) {
            Swal.fire('Info', 'Nessuna nuova password inserita. Nessuna modifica apportata alla password.', 'info');
            return; // Do nothing if password fields are empty
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

        // For admin-specific fields, ensure they are valid if the admin is editing them
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
                (snapshot) => { /* progress */ },
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
            ) as User; // Cast as User, ensure model matches

            this.store.dispatch(changeInfoStart({ localId: this.localId!, value: finalUserData }));

            // selectedFile reset and form marking pristine is handled in success action subscription

        } catch (error) {
            console.error("Errore nel processo di upload o aggiornamento profilo:", error);
            this.store.dispatch(setErrorMessage({ message: "Errore durante l'aggiornamento del profilo." }));
        } finally {
            this.isUploading = false;
             // setLoadingSpinner false is handled by the effect or after success/failure.
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
