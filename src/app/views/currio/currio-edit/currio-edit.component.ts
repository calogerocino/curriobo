// src/app/views/currio/currio-edit/currio-edit.component.ts

import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray, FormBuilder } from '@angular/forms';
import { Currio, CurrioContatti, DatiClienteCurrio } from 'src/app/shared/models/currio.model'; // Aggiorna import
import { getCurrioById } from '../state/currio.selector';
import { AppState } from 'src/app/shared/app.state';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription, filter } from 'rxjs';
import { createCurrio, updateCurrio, loadCurrios } from '../state/currio.action';
import { v4 as uuidv4 } from 'uuid'; // Per generare token
import Swal from 'sweetalert2'; // Per notifiche

@Component({
  selector: 'app-currio-edit',
  templateUrl: './currio-edit.component.html',
  styleUrls: ['./currio-edit.component.scss'],
})
export class CurrioEditComponent implements OnInit, OnDestroy {
  currio: Currio | undefined; // Usa undefined per coerenza con filter(data => !!data)
  currioForm: FormGroup;
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
        // Inizializza qui anche i FormArray se li usi
        // progetti: this.fb.array([]),
        // esperienze: this.fb.array([]),
      });
  }

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      this.currioId = params.get('id');
      if (this.currioId && this.currioId !== 'new') {
        this.isEditMode = true;
        this.store.dispatch(loadCurrios()); // Assicurati che i currio siano caricati
        if (this.currioSubscription) {
            this.currioSubscription.unsubscribe(); // Annulla sottoscrizione precedente
        }
        this.currioSubscription = this.store
          .select(getCurrioById, { id: this.currioId })
          .pipe(filter(data => !!data)) // Filtra undefined o null
          .subscribe((data) => {
            this.currio = data as Currio; // Cast sicuro dopo il filter
            this.initializeForm();
            // Se l'invito era già stato inviato, ricostruisci il link per visualizzarlo
            if (this.currio.status === 'invito_inviato' && this.currio.tokenRegistrazione) {
                const baseUrl = window.location.origin;
                this.linkRegistrazione = `${baseUrl}/auth/completa-registrazione?token=${this.currio.tokenRegistrazione}`;
                this.encodedLinkRegistrazione = encodeURIComponent(this.linkRegistrazione);
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

  getEmptyCurrio(): Currio {
    return {
      id: '', // Sarà generato da Firebase o non necessario per la creazione
      nomePortfolio: '',
      heroTitle: '',
      heroSubtitle: '',
      linguaDefault: 'it',
      contatti: { email: '', github: '', linkedin: '', instagram: '' },
      progetti: [],
      esperienze: [],
      competenze: [],
      chiSonoDescrizione1: '',
      chiSonoDescrizione2: '',
      curriculumUrl: '',
      // Campi per il flusso di registrazione
      status: 'nuova_richiesta', // Default per un currio creato dall'admin, se applicabile
      // datiCliente: { nome: '', email: ''} // Potrebbe essere popolato diversamente se l'admin crea da zero
    } as Currio;
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
      }
    });
    // Logica per patchare FormArray se li usi
  }

  preparaEInviaInvito(): void {
    if (!this.currio || !this.currio.id || !this.currio.datiCliente?.email) {
      Swal.fire('Errore', 'Dati del curriò o email del cliente per l\'invito mancanti.', 'error');
      return;
    }

    const token = uuidv4();
    const baseUrl = window.location.origin;
    this.linkRegistrazione = `${baseUrl}/auth/completa-registrazione?token=${token}`;
    this.encodedLinkRegistrazione = encodeURIComponent(this.linkRegistrazione);

    const scadenzaTimestamp = Date.now() + (24 * 60 * 60 * 1000); // Token valido per 24 ore

    const currioAggiornato: Currio = {
      ...this.currio,
      tokenRegistrazione: token,
      tokenRegistrazioneScadenza: scadenzaTimestamp,
      status: 'invito_inviato',
    };

    this.store.dispatch(updateCurrio({ currio: currioAggiornato }));
    // Il template mostrerà il link. Un messaggio Swal può confermare l'azione.
    Swal.fire({
        title: 'Link di Registrazione Generato!',
        html: `Per favore, invia il seguente link di registrazione a <strong>${this.currio.datiCliente.email}</strong>:<br><br><div class="input-group input-group-sm"><input type="text" class="form-control form-control-sm" value="${this.linkRegistrazione}" readonly><button class="btn btn-outline-secondary btn-sm" type="button" onclick="navigator.clipboard.writeText('${this.linkRegistrazione}')"><i class="feather icon-copy"></i> Copia</button></div><br>Il link scadrà tra 24 ore.`,
        icon: 'info',
        confirmButtonText: 'Ok, ho capito'
    });
  }

  copyToClipboard(inputElement: HTMLInputElement): void {
    inputElement.select();
    document.execCommand('copy');
    // Fornisci un feedback all'utente, es. con un toast o cambiando l'icona del pulsante
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Link copiato!',
        showConfirmButton: false,
        timer: 1500
    });
  }


  onSubmit(): void {
    if (!this.currioForm.valid) {
      this.currioForm.markAllAsTouched();
      Swal.fire('Attenzione', 'Per favore, correggi gli errori nel form.', 'warning');
      return;
    }

    // Assicurati che this.currio sia definito, specialmente in modalità creazione
    const baseCurrio = this.isEditMode && this.currio ? this.currio : this.getEmptyCurrio();

    const formValue = this.currioForm.value;
    const currioToSave: Currio = {
      ...baseCurrio, // Mantiene status, datiCliente, token, etc. se in edit mode
      id: this.isEditMode && this.currio ? this.currio.id : undefined, // Mantiene l'ID se in edit mode
      nomePortfolio: formValue.nomePortfolio,
      heroTitle: formValue.heroTitle,
      heroSubtitle: formValue.heroSubtitle,
      linguaDefault: formValue.linguaDefault,
      chiSonoFotoUrl: formValue.chiSonoFotoUrl,
      chiSonoDescrizione1: formValue.chiSonoDescrizione1,
      chiSonoDescrizione2: formValue.chiSonoDescrizione2,
      contatti: formValue.contatti,
      // ... (gestisci FormArray se presenti)
    };


    if (this.isEditMode && currioToSave.id) {
      this.store.dispatch(updateCurrio({ currio: currioToSave as Currio }));
    } else {
      // In modalità creazione da admin, i campi come datiCliente, status, etc.
      // dovrebbero essere impostati diversamente o non popolati qui.
      // Questo flusso si concentra sull'edit di un currio generato dalla landing.
      // Se l'admin crea un currio da zero, non ci sarà un 'datiCliente' o uno status 'nuova_richiesta'
      // a meno che non li imposti esplicitamente.
      const { id, ...currioDataToCreate } = currioToSave; // Rimuovi l'ID se è vuoto
      this.store.dispatch(createCurrio({ currio: currioDataToCreate as Omit<Currio, 'id'> }));
    }

    // Non reindirizzare immediatamente se è stata appena generata un'email di invito
    if (!this.linkRegistrazione || this.currio?.status !== 'invito_inviato') {
        this.router.navigate(['/admin/currio/listacurrio']);
    } else {
        // Se il link è stato appena generato, l'admin potrebbe volerlo copiare prima di navigare via
        Swal.fire('Curriò Aggiornato', 'Le modifiche al curriò sono state salvate.', 'success');
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/currio/listacurrio']);
  }

  openPreviewInNewTab(): void {
    if (this.currio && this.currio.id) {
      // Implementa la logica per l'URL di anteprima se hai una pagina dedicata
      // const previewUrl = this.router.serializeUrl(this.router.createUrlTree(['/currio/view', this.currio.id]));
      // window.open(previewUrl, '_blank');
      Swal.fire("Anteprima", "Funzionalità di anteprima in nuova scheda da implementare.", "info");
      console.log("Dati del Curriò per l'anteprima:", this.currioForm.value);
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
