// src/app/views/currio/currio-edit/currio-edit.component.ts

import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  FormArray,
  FormBuilder,
} from '@angular/forms';
import {
  Currio,
  CurrioContatti,
  DatiClienteCurrio,
} from 'src/app/shared/models/currio.model'; // Aggiorna import
import { getCurrioById } from '../state/currio.selector';
import { AppState } from 'src/app/shared/app.state';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription, filter } from 'rxjs';
import {
  createCurrio,
  updateCurrio,
  loadCurrios,
} from '../state/currio.action';
import { v4 as uuidv4 } from 'uuid'; // Per generare token
import Swal from 'sweetalert2'; // Per notifiche

@Component({
  selector: 'app-currio-edit',
  templateUrl: './currio-edit.component.html',
  styleUrls: ['./currio-edit.component.scss'],
})
export class CurrioEditComponent implements OnInit, OnDestroy {
  currio: Currio | undefined;
  currioForm: FormGroup; // Deve essere inizializzata
  private currioSubscription: Subscription | undefined;
  private routeSubscription: Subscription | undefined;
  isEditMode = false;
  currioId: string | null = null;
  linkRegistrazione: string | null = null;
  encodedLinkRegistrazione: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly store: Store<AppState>,
    private readonly router: Router,
    private readonly fb: FormBuilder
  ) {
    // Inizializza il form qui o in ngOnInit per evitare 'currioForm' is possibly 'undefined'
    this.currioForm = this.fb.group({
      nomePortfolio: ['', Validators.required],
      heroTitle: ['', Validators.required],
      heroSubtitle: [''],
      linguaDefault: ['it', Validators.required],
      chiSonoFotoUrl: [''],
      chiSonoDescrizione1: [''],
      chiSonoDescrizione2: [''],
      contatti: this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        github: [''],
        linkedin: [''],
        instagram: [''],
      }),
      // Aggiungi qui altri FormArray o FormControl se necessario
    });
  }

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      this.currioId = params.get('id');
      if (this.currioId && this.currioId !== 'new') {
        this.isEditMode = true;
        this.store.dispatch(loadCurrios()); // Carica tutti i currios per trovare quello specifico
        // o usa un'azione specifica loadCurrioById se disponibile e funzionante
        if (this.currioSubscription) {
          this.currioSubscription.unsubscribe();
        }
        this.currioSubscription = this.store
          .select(getCurrioById, { id: this.currioId }) // Passa l'id come props
          .pipe(filter((data): data is Currio => !!data)) // Assicura che data non sia undefined
          .subscribe((data) => {
            this.currio = data;
            this.initializeForm();
            if (
              this.currio.status === 'invito_spedito' &&
              this.currio.tokenRegistrazione
            ) {
              const baseUrl = window.location.origin;
              this.linkRegistrazione = `${baseUrl}/auth/completa-registrazione?token=${this.currio.tokenRegistrazione}`;
              this.encodedLinkRegistrazione = encodeURIComponent(
                this.linkRegistrazione
              );
            } else {
              this.linkRegistrazione = null;
              this.encodedLinkRegistrazione = null;
            }
          });
      } else {
        this.isEditMode = false;
        this.currio = this.getEmptyCurrio();
        this.initializeForm();
        this.linkRegistrazione = null;
        this.encodedLinkRegistrazione = null;
      }
    });
  }

  initializeForm(): void {
    if (!this.currio) return;
    this.currioForm.patchValue({
      nomePortfolio: this.currio.nomePortfolio || '',
      heroTitle: this.currio.heroTitle || '',
      heroSubtitle: this.currio.heroSubtitle || '',
      linguaDefault: this.currio.linguaDefault || 'it',
      chiSonoFotoUrl: this.currio.chiSonoFotoUrl || '',
      chiSonoDescrizione1: this.currio.chiSonoDescrizione1 || '',
      chiSonoDescrizione2: this.currio.chiSonoDescrizione2 || '',
      contatti: {
        email: this.currio.contatti?.email || '',
        github: this.currio.contatti?.github || '',
        linkedin: this.currio.contatti?.linkedin || '',
        instagram: this.currio.contatti?.instagram || '',
      },
    });
  }

  private getEmptyCurrio(): Currio {
    return {
      id: '', // Sarà generato da Firebase o non necessario per la creazione
      nomePortfolio: '',
      heroTitle: '',
      heroSubtitle: '',
      linguaDefault: 'it',
      contatti: { email: '', github: '', linkedin: '', instagram: '' },
      status: 'nuova_richiesta', // Default per un currio creato dall'admin
    } as Currio; // Cast parziale, assicurati che tutti i campi obbligatori siano presenti
  }

  preparaEInviaInvito(): void {
    if (!this.currio || !this.currio.id || !this.currio.datiCliente?.email) {
      Swal.fire(
        'Errore',
        "Dati del curriò o email del cliente per l'invito mancanti.",
        'error'
      );
      return;
    }

    const token = uuidv4();
    const baseUrl = window.location.origin;
    this.linkRegistrazione = `${baseUrl}/auth/completa-registrazione?token=${token}`;
    this.encodedLinkRegistrazione = encodeURIComponent(this.linkRegistrazione);

    const scadenzaTimestamp = Date.now() + 24 * 60 * 60 * 1000; // Token valido per 24 ore

    const currioAggiornato: Currio = {
      ...this.currio,
      tokenRegistrazione: token,
      tokenRegistrazioneScadenza: scadenzaTimestamp,
      status: 'invito_spedito',
    };

    this.store.dispatch(updateCurrio({ currio: currioAggiornato }));
    Swal.fire({
      title: 'Link di Registrazione Generato!',
      html: `Per favore, invia il seguente link di registrazione a <strong>${this.currio.datiCliente.email}</strong>:<br><br><div class="input-group input-group-sm"><input type="text" class="form-control form-control-sm" value="${this.linkRegistrazione}" readonly #registrationLinkInput><button class="btn btn-outline-secondary btn-sm" type="button" (click)="copyToClipboard(registrationLinkInput)"><i class="feather icon-copy"></i> Copia</button></div><br>Il link scadrà tra 24 ore.`,
      icon: 'info',
      confirmButtonText: 'Ok, ho capito',
    });
  }

  copyToClipboard(inputElement: HTMLInputElement): void {
    inputElement.select();
    document.execCommand('copy');
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Link copiato!',
      showConfirmButton: false,
      timer: 1500,
    });
  }

  onSubmit(): void {
    if (!this.currioForm.valid) {
      this.currioForm.markAllAsTouched();
      Swal.fire(
        'Attenzione',
        'Per favore, correggi gli errori nel form.',
        'warning'
      );
      return;
    }

    const baseCurrio =
      this.isEditMode && this.currio ? this.currio : this.getEmptyCurrio();
    const formValue = this.currioForm.value;

    const currioToSave: Currio = {
      ...baseCurrio,
      id: this.isEditMode && this.currio ? this.currio.id : undefined, // Mantiene l'ID se in edit mode
      nomePortfolio: formValue.nomePortfolio,
      heroTitle: formValue.heroTitle,
      heroSubtitle: formValue.heroSubtitle,
      linguaDefault: formValue.linguaDefault,
      chiSonoFotoUrl: formValue.chiSonoFotoUrl,
      chiSonoDescrizione1: formValue.chiSonoDescrizione1,
      chiSonoDescrizione2: formValue.chiSonoDescrizione2,
      contatti: formValue.contatti,
      // Se lo status era 'invito_spedito', preservalo a meno che non sia stato attivato
      status: baseCurrio.status, // Mantiene lo status corrente
      // Preserva userId, tokenRegistrazione, tokenRegistrazioneScadenza se già presenti e non modificati da altre logiche
      userId: baseCurrio.userId,
      tokenRegistrazione: baseCurrio.tokenRegistrazione,
      tokenRegistrazioneScadenza: baseCurrio.tokenRegistrazioneScadenza,
      datiCliente: baseCurrio.datiCliente, // Preserva i dati cliente
    };

    if (this.isEditMode && currioToSave.id) {
      this.store.dispatch(updateCurrio({ currio: currioToSave as Currio }));
      Swal.fire(
        'Curriò Aggiornato',
        'Le modifiche sono state salvate.',
        'success'
      );
      // Considera se reindirizzare o meno, specialmente se è stato appena generato un invito
      if (!this.linkRegistrazione || this.currio?.status !== 'invito_spedito') {
        this.router.navigate(['/admin/currio/listacurrio']);
      }
    } else {
      // Logica per la creazione di un nuovo Curriò da parte dell'admin (se necessaria)
      // In questo caso, 'datiCliente' potrebbe dover essere inserito manualmente dall'admin.
      // const { id, ...currioDataToCreate } = currioToSave;
      // this.store.dispatch(createCurrio({ currio: currioDataToCreate as Omit<Currio, 'id'> }));
      // this.router.navigate(['/admin/currio/listacurrio']);
      console.warn(
        'Modalità creazione da admin non completamente implementata in questo snippet.'
      );
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/currio/listacurrio']);
  }

  openPreviewInNewTab(): void {
    if (this.currio && this.currio.id) {
      const url = this.router.serializeUrl(
        // this.router.createUrlTree(['/admin/currio/preview', this.currio.id]) // URL corretto
        this.router.createUrlTree([this.currio.id])
      );
      window.open(url, '_blank');
    } else {
      Swal.fire(
        'Errore',
        "ID Curriò non disponibile per l'anteprima.",
        'error'
      );
    }
  }

  ngOnDestroy(): void {
    if (this.currioSubscription) {
      this.currioSubscription.unsubscribe();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }
}
