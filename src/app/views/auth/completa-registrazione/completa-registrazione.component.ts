import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/shared/app.state';
import { CurrioService } from 'src/app/shared/servizi/currio.service';
import { AuthService } from 'src/app/shared/servizi/auth.service';
import { Currio } from 'src/app/shared/models/currio.model';
import * as CurrioActions from 'src/app/views/currio/state/currio.action';
import Swal from 'sweetalert2';
import { Subscription, firstValueFrom, timeout, catchError, of } from 'rxjs';
import { setLoadingSpinner } from 'src/app/shared/store/shared.actions';
import { User as FirebaseAuthUserType } from '@firebase/auth-types';
import { Actions, ofType } from '@ngrx/effects';

@Component({
  selector: 'app-completa-registrazione',
  templateUrl: './completa-registrazione.component.html',
})
export class CompletaRegistrazioneComponent implements OnInit, OnDestroy {
  registrationForm: FormGroup;
  token: string | null = null;
  currioData: Currio | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  private curriosSub: Subscription | undefined;
  private actionsSub: Subscription | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private store: Store<AppState>,
    private currioService: CurrioService,
    private authService: AuthService,
    private actions$: Actions
  ) {
    this.registrationForm = this.fb.group(
      {
        email: [
          { value: '', disabled: true },
          [Validators.required, Validators.email],
        ],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*.,;?_=\-+]).{8,}$/
            ),
          ],
        ],
        confirmPassword: ['', Validators.required],
      },
      { validator: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (this.token) {
      this.verifyTokenAndLoadData(this.token);
    } else {
      this.errorMessage = 'Token di registrazione mancante o non valido.';
      this.isLoading = false;
      Swal.fire('Errore', this.errorMessage, 'error');
    }
  }

  passwordMatchValidator(
    control: AbstractControl
  ): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      return { mismatch: true };
    }
    return null;
  }

  async verifyTokenAndLoadData(token: string): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;
    this.store.dispatch(setLoadingSpinner({ status: true }));
    this.curriosSub = this.currioService.getCurrios().subscribe({
      next: (currios) => {
        const currio = currios.find(
          (c) => c.tokenRegistrazione === token && c.status === 'invito_spedito'
        );
        if (currio && currio.datiCliente?.email) {
          if (
            currio.tokenRegistrazioneScadenza &&
            Date.now() > currio.tokenRegistrazioneScadenza
          ) {
            this.errorMessage =
              "Il link di registrazione è scaduto. Contatta l'amministratore.";
            this.currioData = null;
            Swal.fire('Link Scaduto', this.errorMessage, 'error');
          } else {
            this.currioData = currio;
            this.registrationForm.patchValue({
              email: currio.datiCliente.email,
            });
          }
        } else {
          this.errorMessage =
            "Token non valido, invito già utilizzato o scaduto. Contatta l'amministratore.";
          this.currioData = null;
          Swal.fire('Token Non Valido', this.errorMessage, 'error');
        }
        this.isLoading = false;
        this.store.dispatch(setLoadingSpinner({ status: false }));
      },
      error: (err) => {
        console.error('Errore nel caricare i currio per verifica token:', err);
        this.errorMessage =
          'Errore durante la verifica del token. Riprova più tardi.';
        this.isLoading = false;
        this.store.dispatch(setLoadingSpinner({ status: false }));
        Swal.fire('Errore Server', this.errorMessage, 'error');
      },
    });
  }

  async onSubmit(): Promise<void> {
    if (!this.registrationForm.valid) {
      this.registrationForm.markAllAsTouched();
      Swal.fire(
        'Attenzione',
        'Per favore, correggi gli errori nel form.',
        'warning'
      );
      return;
    }
    if (!this.currioData || !this.currioData.datiCliente) {
      Swal.fire(
        'Errore Interno',
        'Dati del curriò o del cliente mancanti.',
        'error'
      );
      return;
    }

    this.isLoading = true;
    this.store.dispatch(setLoadingSpinner({ status: true }));
    this.errorMessage = null;

    const email = this.currioData.datiCliente.email;
    const password = this.registrationForm.value.password;
    const displayName = this.currioData.datiCliente.nome;

    try {
      const result =
        await this.authService.afAuth.createUserWithEmailAndPassword(
          email,
          password
        );
      const newAuthUser = result.user as FirebaseAuthUserType;

      if (!newAuthUser) {
        throw new Error('Creazione utente Firebase Auth fallita.');
      }

      if (displayName) {
        await newAuthUser.updateProfile({ displayName: displayName });
      }

      await this.authService.SetUserData({
        uid: newAuthUser.uid,
        email: newAuthUser.email,
        displayName: displayName || newAuthUser.displayName || '',
        photoURL: newAuthUser.photoURL || 'assets/images/default-avatar.png',
        emailVerified: newAuthUser.emailVerified,
        ruolo: 'cliente',
      });

      if (this.currioData && this.currioData.id) {
        const updatedCurrio: Currio = {
          ...this.currioData,
          userId: newAuthUser.uid,
          status: 'attivo',
          tokenRegistrazione: undefined,
          tokenRegistrazioneScadenza: undefined,
        };
        this.store.dispatch(
          CurrioActions.updateCurrio({ currio: updatedCurrio })
        );

        await firstValueFrom(
          this.actions$.pipe(
            ofType(
              CurrioActions.updateCurrioSuccess,
              CurrioActions.updateCurrioFailure
            ),
            timeout(10000),
            catchError((err) => {
              console.warn(
                "Timeout o errore nell'ascolto dell'azione updateCurrio:",
                err
              );
              return of({ type: 'UPDATE_CURRIO_TIMEOUT_OR_EFFECT_ERROR' });
            })
          )
        );
      }

      Swal.fire(
        'Registrazione Completata!',
        'Il tuo account è stato creato con successo. Ora puoi effettuare il login.',
        'success'
      );
      this.router.navigate(['/auth/login-cliente']); 
    } catch (error: any) {
      this.errorMessage = this.authService.getErrorMessage(
        error.code || error.message
      );
      Swal.fire('Errore Registrazione', this.errorMessage, 'error');
    } finally {
      this.isLoading = false;
      this.store.dispatch(setLoadingSpinner({ status: false }));
    }
  }

  ngOnDestroy(): void {
    if (this.curriosSub) this.curriosSub.unsubscribe();
    if (this.actionsSub) this.actionsSub.unsubscribe();
  }
}
