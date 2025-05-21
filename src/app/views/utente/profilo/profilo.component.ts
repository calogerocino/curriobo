import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
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

  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  isUploading: boolean = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly store: Store<AppState>,
    private readonly userService: UserService,
    public readonly authService: AuthService,
    private readonly actions$: Actions,
    @Inject(Storage) private readonly storage: Storage // Inietta Storage
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
        // Ricarica i dati utente per aggiornare l'immagine profilo visualizzata, se ffuser è usato per [src]
        if (this.localId) {
            this.loadUserDataAndInitializeForm(this.localId, false); // Non reinizializzare il form completamente se non serve
        }
      }
    });
  }

  loadUserDataAndInitializeForm(userId: string, initializeFullForm: boolean = true): void {
    this.store.dispatch(setLoadingSpinner({ status: true }));
    this.userService.Searchuser(userId).pipe(take(1)).subscribe({
      next: (firestoreUser) => {
        this.store.dispatch(setLoadingSpinner({ status: false }));
        if (firestoreUser) {
          this.ffuser = firestoreUser;
          if(initializeFullForm){
            this.emailVerifiedForm = firestoreUser.emailVerified || false;
            this.initializeForm(firestoreUser);
          } else {
            // Aggiorna solo l'anteprima se non si reinizializza il form
             this.imagePreview = firestoreUser.photoURL || this.authService.DEFAULT_AVATAR_URL;
          }
        } else {
          console.error(`Utente con ID ${userId} non trovato in Firestore.`);
          Swal.fire('Errore', 'Utente non trovato.', 'error')
            .then(() => this.router.navigate(['/admin/utente/utenti']));
        }
      },
      error: (err) => {
        this.store.dispatch(setLoadingSpinner({ status: false }));
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
      const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
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
      this.imagePreview = this.ffuser?.photoURL || this.authService.DEFAULT_AVATAR_URL;
    }
  }


  updateWarningState(): void {
    if (this.userForm && (this.userForm.dirty || this.selectedFile)) {
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
  }

  async onSubmit(event: Event) {
    const submitEvent = event as SubmitEvent;
    const submitter = submitEvent.submitter as HTMLButtonElement | null;

    // Logica di validazione specifica per 'changePassword'
    if (submitter && submitter.name === 'changePassword') {
      const newPassControl = this.userForm.get('passwordnew');
      const newRePassControl = this.userForm.get('passwordnewre');
      newPassControl?.markAsTouched();
      newRePassControl?.markAsTouched();
      newPassControl?.updateValueAndValidity();
      this.userForm.updateValueAndValidity();


      if (newPassControl?.invalid || this.userForm.hasError('mismatch')) {
         Swal.fire('Attenzione', 'Correggi gli errori nel form della password.', 'warning');
         this.store.dispatch(setLoadingSpinner({ status: false }));
         return;
      }
       if (!newPassControl?.value && !newRePassControl?.value) {
         Swal.fire('Info', 'Nessuna nuova password inserita.', 'info');
         return;
      }
    } else if (submitter && submitter.name === 'changeUser') {
        const profileControls = ['displayName', 'cellulare'];
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
          photoURLPromise = Promise.resolve(this.ffuser?.photoURL); // Usa URL esistente se nessun nuovo file
        }

        try {
          const newPhotoURL = await photoURLPromise; // Aspetta che l'upload sia completato (se c'è)

          const displayName: string = this.userForm.value.displayName;
          const cellulare: string = this.userForm.value.cellulare;
          const isAdminRole: boolean = this.userForm.value.isAdminRole;
          const newRole = isAdminRole ? 'admin' : 'cliente';

          const updatedUserData: Partial<User> = {
            displayName: displayName,
            cellulare: cellulare,
            ruolo: newRole,
            photoURL: newPhotoURL // Questo sarà l'URL nuovo o quello esistente
          };

          const finalUserData = Object.fromEntries(
             Object.entries(updatedUserData).filter(([_, v]) => v !== undefined)
          ) as User;

          this.store.dispatch(changeInfoStart({ localId: this.localId!, value: finalUserData }));

          // Resetta lo stato del file solo dopo il successo dell'operazione changeInfo
          const successSub = this.actions$.pipe(ofType(changeInfoSuccess), take(1)).subscribe(() => {
            this.selectedFile = null;
            // L'imagePreview verrà aggiornato dal loadUserDataAndInitializeForm chiamato nell'ngOnInit dell'actionsSubscription
             this.userForm.markAsPristine(); // Resetta lo stato dirty del form
             this.updateWarningState();
          });
          this.actionsSubscription?.add(successSub);


        } catch (error) {
            console.error("Errore nel processo di upload o aggiornamento profilo:", error);
            this.store.dispatch(setLoadingSpinner({ status: false }));
            // Potrebbe essere necessario un messaggio di errore specifico per l'upload fallito
        } finally {
            this.isUploading = false;
            // setLoadingSpinner(false) è gestito globalmente dall'effetto NGRX o qui se l'effetto non viene chiamato
        }

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
