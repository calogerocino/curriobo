// src/app/views/auth/completa-registrazione/completa-registrazione.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/shared/app.state';
import { CurrioService } from 'src/app/shared/servizi/currio.service';
import { AuthService } from 'src/app/shared/servizi/auth.service';
import { Currio } from 'src/app/shared/models/currio.model';
import { updateCurrio } from 'src/app/views/currio/state/currio.action';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { setLoadingSpinner } from 'src/app/shared/store/shared.actions';
import { User as FirebaseAuthUser } from '@firebase/auth-types'; // Per il tipo utente da Firebase Auth

@Component({
  selector: 'app-completa-registrazione',
  templateUrl: './completa-registrazione.component.html',
  // styleUrls: ['./completa-registrazione.component.scss']
})
export class CompletaRegistrazioneComponent implements OnInit, OnDestroy {
  registrationForm: FormGroup;
  token: string | null = null;
  currioData: Currio | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  private curriosSub: Subscription | undefined; // Cambiato nome per chiarezza

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private store: Store<AppState>,
    private currioService: CurrioService,
    private authService: AuthService // Servizio per createUserWithEmailAndPassword
  ) {
    this.registrationForm = this.fb.group({
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        // Validators.pattern(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*#?&^_-]).{8,}/) // Pattern robusto
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/) // Alternativa
      ]],
      confirmPassword: ['', Validators.required],
    }, { validator: this.passwordMatchValidator });
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

  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { 'mismatch': true };
    }
    return null;
  }

  async verifyTokenAndLoadData(token: string): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;
    this.store.dispatch(setLoadingSpinner({ status: true }));

    // Nota: getCurrios() carica tutti i currio. Per produzione, considera un metodo più specifico
    // nel service se la collezione cresce molto (es. getCurrioByToken(token)).
    this.curriosSub = this.currioService.getCurrios().subscribe({
      next: (currios) => {
        const currio = currios.find(c => c.tokenRegistrazione === token && c.status === 'invito_inviato');
        if (currio && currio.datiCliente?.email) {
          if (currio.tokenRegistrazioneScadenza && Date.now() > currio.tokenRegistrazioneScadenza) {
            this.errorMessage = 'Il link di registrazione è scaduto. Contatta l\'amministratore.';
            this.currioData = null;
            Swal.fire('Errore', this.errorMessage, 'error');
          } else {
            this.currioData = currio;
            this.registrationForm.patchValue({ email: currio.datiCliente.email });
          }
        } else {
          this.errorMessage = 'Token non valido, invito già utilizzato o scaduto. Contatta l\'amministratore.';
          this.currioData = null;
          Swal.fire('Errore', this.errorMessage, 'error');
        }
        this.isLoading = false;
        this.store.dispatch(setLoadingSpinner({ status: false }));
      },
      error: (err) => {
        console.error("Errore nel caricare i currio per verifica token:", err);
        this.errorMessage = 'Errore durante la verifica del token. Riprova più tardi.';
        this.isLoading = false;
        this.store.dispatch(setLoadingSpinner({ status: false }));
        Swal.fire('Errore', this.errorMessage, 'error');
      }
    });
  }

  async onSubmit(): Promise<void> {
    if (!this.registrationForm.valid) {
      this.registrationForm.markAllAsTouched();
      Swal.fire('Attenzione', 'Per favore, correggi gli errori nel form.', 'warning');
      return;
    }
    if (!this.currioData || !this.currioData.datiCliente) {
      Swal.fire('Errore', 'Dati cliente non trovati. Impossibile procedere.', 'error');
      return;
    }

    this.isLoading = true;
    this.store.dispatch(setLoadingSpinner({ status: true }));

    const email = this.currioData.datiCliente.email; // Email non modificabile
    const password = this.registrationForm.value.password;
    const displayName = this.currioData.datiCliente.nome;

    try {
      // 1. Crea utente in Firebase Auth
      // Usiamo il metodo SignUp del tuo AuthService che dovrebbe già gestire la creazione
      // e la successiva chiamata a SetUserData per Firestore.
      // Se SignUp è pensato per NGRX Effects, potresti dover dispatchare un'azione qui.
      // Per ora, assumiamo che authService.SignUp possa essere chiamato direttamente
      // e che gestisca la creazione Auth + Firestore.
      // NOTA: Il tuo `AuthService.SignUp` attuale usa `afAuth.createUserWithEmailAndPassword`
      // e poi chiama `this.SetUserData(result.user)`. Questo è OK.
      // `this.SetUserData` nel tuo AuthService usa `user.uid`.

      const result = await this.authService.afAuth.createUserWithEmailAndPassword(email, password);
      const newAuthUser = result.user as FirebaseAuthUser; // Cast al tipo corretto

      if (!newAuthUser) {
        throw new Error('Creazione utente Firebase Auth fallita.');
      }

      // 2. Aggiorna il profilo Firebase Auth con il displayName
      if (displayName) {
        await newAuthUser.updateProfile({ displayName: displayName });
      }

      // 3. Salva/Aggiorna dati utente in Firestore "users" collection
      // Questa chiamata è cruciale e deve usare newAuthUser.uid
      await this.authService.SetUserData({
        uid: newAuthUser.uid, // UID da Firebase Auth
        email: newAuthUser.email,
        displayName: displayName || newAuthUser.displayName,
        photoURL: newAuthUser.photoURL, // Sarà null inizialmente
        emailVerified: newAuthUser.emailVerified, // Sarà false
        // Aggiungi altri campi di default per la collezione 'users' se necessario
        ruolo: 'cliente', // Esempio di ruolo di default
      });


      // 4. Aggiorna il documento Currio in Firestore
      if (this.currioData && this.currioData.id) {
        const updatedCurrio: Currio = {
          ...this.currioData,
          userId: newAuthUser.uid, // Associa l'Auth UID al Currio
          status: 'attivo',
          tokenRegistrazione: undefined, // Rimuovi token
          tokenRegistrazioneScadenza: undefined,
        };
        // Dispatch l'azione per aggiornare il currio
        this.store.dispatch(updateCurrio({ currio: updatedCurrio }));
      }

      this.isLoading = false;
      this.store.dispatch(setLoadingSpinner({ status: false }));
      Swal.fire('Registrazione Completata!', 'Il tuo account è stato creato con successo. Ora puoi effettuare il login.', 'success');
      this.router.navigate(['/auth/login']);

    } catch (error: any) {
      this.isLoading = false;
      this.store.dispatch(setLoadingSpinner({ status: false }));
      console.error('Errore durante la registrazione:', error);
      const firebaseErrorMsg = this.authService.getErrorMessage(error.code || error.message); // Usa il tuo gestore errori
      Swal.fire('Errore Registrazione', firebaseErrorMsg || 'Non è stato possibile completare la registrazione.', 'error');
    }
  }

  ngOnDestroy(): void {
    if (this.curriosSub) {
      this.curriosSub.unsubscribe();
    }
  }
}
