import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, Validators, FormBuilder, FormArray } from '@angular/forms';
import { Currio, CurrioProgetto, CurrioEsperienza, CurrioCompetenza } from 'src/app/shared/models/currio.model';
import { getCurrioById, getCurrioLoading, getCurrios } from '../state/currio.selector';
import { AppState } from 'src/app/shared/app.state';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription, of } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { updateCurrio, loadCurrios, deleteCurrio, loadCurrioById, updateCurrioSuccess } from '../state/currio.action';
import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2';
import { setLoadingSpinner, setErrorMessage } from 'src/app/shared/store/shared.actions';
import { Actions, ofType } from '@ngrx/effects';
import { User } from 'src/app/shared/models/user.interface';
import { getUser } from '../../auth/state/auth.selector';
import { AuthService } from 'src/app/shared/servizi/auth.service';

@Component({
  selector: 'app-currio-edit',
  templateUrl: './currio-edit.component.html',
    styleUrls: ['./currio-edit.component.scss']
})

export class CurrioEditComponent implements OnInit, OnDestroy {
  currio: Currio | undefined | null;
  currioForm: FormGroup;
  private subscriptions: Subscription = new Subscription();
  currioId: string | null = null;
  linkRegistrazione: string | null = null;
  encodedLinkRegistrazione: string | null = null;
  isSubmitting$: Observable<boolean>;
  isLoadingCurrio = true;
  showUnsavedChangesWarning = false;

  currentUser$: Observable<User | null> = this.store.select(getUser);
  currentUserRole: 'admin' | 'cliente' | undefined;
  isUserAdmin = false;
  currentUserId: string | undefined;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly store: Store<AppState>,
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly actions$: Actions,
    private readonly authService: AuthService
  ) {
    this.isSubmitting$ = this.store.select(getCurrioLoading);
  }

  ngOnInit(): void {
    this.initForm();
    this.subscribeToUserRole();
    this.subscribeToFormChanges();
    this.subscribeToSuccessActions();
  }

  private subscribeToUserRole(): void {
    const userSub = this.currentUser$.subscribe(user => {
      if (user && user.ruolo) {
        this.currentUserRole = user.ruolo;
        this.isUserAdmin = user.ruolo === 'admin';
        this.currentUserId = user.localId;
      } else {
        this.isUserAdmin = false;
      }
      this.determineLoadStrategy();
    });
    this.subscriptions.add(userSub);
  }

  private determineLoadStrategy(): void {
    this.isLoadingCurrio = true;
    this.store.dispatch(setLoadingSpinner({ status: true }));

    if (this.router.url.startsWith('/admin/currio/edit/')) {
      this.route.paramMap.pipe(take(1)).subscribe(params => {
        this.currioId = params.get('id');
        if (this.currioId) {
          this.store.dispatch(loadCurrioById({ id: this.currioId }));
          this.subscribeToSpecificCurrio(this.currioId);
        } else {
           this.handleCurrioLoadingError('ID Curriò non fornito per la modifica admin.');
        }
      });
    } else if (this.router.url.startsWith('/cliente/currio')) {
      if (this.currentUserId) {
        this.store.dispatch(loadCurrios());
        const currioByUserSub = this.store.select(getCurrios).pipe(
          map(currios => currios.find(c => c.userId === this.currentUserId)),
          filter(currio => !!currio),
          take(1)
        ).subscribe(userCurrio => {
          if (userCurrio && userCurrio.id) {
            this.currioId = userCurrio.id;
            this.store.dispatch(loadCurrioById({ id: this.currioId }));
            this.subscribeToSpecificCurrio(this.currioId);
          } else {
            this.handleCurrioLoadingError('Nessun Curriò trovato per questo account cliente.');
          }
        });
        this.subscriptions.add(currioByUserSub);
      } else {
        this.handleCurrioLoadingError('ID utente non disponibile per caricare il Curriò del cliente.');
      }
    } else {
       this.handleCurrioLoadingError('Rotta non riconosciuta o dati insufficienti per caricamento Curriò.');
    }
  }

  private subscribeToSpecificCurrio(id: string): void {
    const currioSub = this.store.select(getCurrioById, { id }).pipe(
      filter((currioLoaded): currioLoaded is Currio => !!currioLoaded && !!currioLoaded.id),
      take(1)
    ).subscribe(currioDetails => {
        this.currio = currioDetails;
        this.initializeForm();
        if (this.isUserAdmin && this.currio.status === 'invito_spedito' && this.currio.tokenRegistrazione) {
          const baseUrl = window.location.origin;
          this.linkRegistrazione = `${baseUrl}/auth/completa-registrazione?token=${this.currio.tokenRegistrazione}`;
          this.encodedLinkRegistrazione = encodeURIComponent(this.linkRegistrazione);
        } else {
          this.linkRegistrazione = null;
          this.encodedLinkRegistrazione = null;
        }
        this.isLoadingCurrio = false;
        this.store.dispatch(setLoadingSpinner({ status: false }));
    }, error => {
        this.handleCurrioLoadingError('Errore durante il recupero dei dettagli del Curriò.', error);
    });

    const timeoutSub = of(null).pipe(take(1), tap(() => {
        if (!this.currio && this.isLoadingCurrio) {
        }
    })).subscribe();

    this.subscriptions.add(currioSub);
    this.subscriptions.add(timeoutSub);
  }

  private initForm(): void {
    this.currioForm = this.fb.group({
      nomePortfolio: ['', Validators.required],
      heroTitle: ['', Validators.required],
      heroSubtitle: [''],
      linguaDefault: ['it', Validators.required],
      templateScelto: ['modern', Validators.required],
      chiSonoFotoUrl: [''],
      chiSonoDescrizione1: [''],
      chiSonoDescrizione2: [''],
      contatti: this.fb.group({
        email: ['', [Validators.email]],
        github: [''],
        linkedin: [''],
        instagram: [''],
      }),
      progetti: this.fb.array([]),
      esperienze: this.fb.array([]),
      competenze: this.fb.array([])
    });
  }

 initializeForm(): void {
    if (!this.currio) {
      this.handleCurrioLoadingError('Tentativo di inizializzare il form senza dati Curriò.');
      return;
    }
    this.currioForm.patchValue({
      nomePortfolio: this.currio.nomePortfolio || '',
      heroTitle: this.currio.heroTitle || '',
      heroSubtitle: this.currio.heroSubtitle || '',
      linguaDefault: this.currio.linguaDefault || 'it',
      templateScelto: this.currio.templateScelto || 'modern',
      chiSonoFotoUrl: this.currio.chiSonoFotoUrl || '',
      chiSonoDescrizione1: this.currio.chiSonoDescrizione1 || '',
      chiSonoDescrizione2: this.currio.chiSonoDescrizione2 || '',
      contatti: {
        email: this.currio.contatti?.email || this.currio.datiCliente?.email || '',
        github: this.currio.contatti?.github || '',
        linkedin: this.currio.contatti?.linkedin || '',
        instagram: this.currio.contatti?.instagram || '',
      }
    });

    this.clearAndPopulateFormArray(this.progettiFormArray, this.currio.progetti, this.createProgettoGroup.bind(this));
    this.clearAndPopulateFormArray(this.esperienzeFormArray, this.currio.esperienze, this.createEsperienzaGroup.bind(this));
    this.clearAndPopulateFormArray(this.competenzeFormArray, this.currio.competenze, this.createCompetenzaGroup.bind(this));

    this.currioForm.markAsPristine();
    this.updateWarningState();
  }

  private clearAndPopulateFormArray(formArray: FormArray, items: any[] | undefined, createGroupFn: (item?: any) => FormGroup): void {
    this.clearFormArray(formArray);
    items?.forEach(item => formArray.push(createGroupFn(item)));
  }

  private subscribeToFormChanges(): void {
    const formSub = this.currioForm.valueChanges.subscribe(() => this.updateWarningState());
    this.subscriptions.add(formSub);
  }

  private subscribeToSuccessActions(): void {
    const successSub = this.actions$.pipe(
      ofType(updateCurrioSuccess)
    ).subscribe(() => {
      this.currioForm.markAsPristine();
      this.updateWarningState();
      if (this.currioId) {
         this.store.dispatch(loadCurrioById({id: this.currioId}));
      }
    });
    this.subscriptions.add(successSub);
  }

  updateWarningState(): void {
    this.showUnsavedChangesWarning = this.currioForm && this.currioForm.dirty;
  }

  selectTemplate(templateName: 'modern' | 'vintage' | 'classic'): void {
    this.currioForm.get('templateScelto')?.setValue(templateName);
    this.currioForm.markAsDirty();
  }

  get progettiFormArray() { return this.currioForm.get('progetti') as FormArray; }
  createProgettoGroup(progetto?: CurrioProgetto): FormGroup {
    return this.fb.group({
      id: [progetto?.id || uuidv4()],
      titolo: [progetto?.titolo || '', Validators.required],
      descrizione: [progetto?.descrizione || '', Validators.required],
      immagineUrl: [progetto?.immagineUrl || ''],
      linkProgetto: [progetto?.linkProgetto || ''],
      tags: this.fb.array(progetto?.tags?.map(tag => this.fb.control(tag)) || [])
    });
  }
  addProgetto(): void { this.progettiFormArray.push(this.createProgettoGroup()); this.currioForm.markAsDirty(); }
  removeProgetto(index: number): void { this.progettiFormArray.removeAt(index); this.currioForm.markAsDirty(); }
  getTags(progettoIndex: number): FormArray { return this.progettiFormArray.at(progettoIndex).get('tags') as FormArray; }
  addTag(progettoIndex: number): void { this.getTags(progettoIndex).push(this.fb.control('')); this.currioForm.markAsDirty(); }
  removeTag(progettoIndex: number, tagIndex: number): void { this.getTags(progettoIndex).removeAt(tagIndex); this.currioForm.markAsDirty(); }

  get esperienzeFormArray() { return this.currioForm.get('esperienze') as FormArray; }
  createEsperienzaGroup(esperienza?: CurrioEsperienza): FormGroup {
    return this.fb.group({
      id: [esperienza?.id || uuidv4()],
      titolo: [esperienza?.titolo || '', Validators.required],
      tipo: [esperienza?.tipo || 'lavoro', Validators.required],
      aziendaScuola: [esperienza?.aziendaScuola || '', Validators.required],
      date: [esperienza?.date || '', Validators.required],
      descrizioneBreve: [esperienza?.descrizioneBreve || ''],
      dettagli: this.fb.array(esperienza?.dettagli?.map(d => this.fb.control(d)) || []),
      competenzeAcquisite: this.fb.array(esperienza?.competenzeAcquisite?.map(c => this.fb.control(c)) || [])
    });
  }
  addEsperienza(): void { this.esperienzeFormArray.push(this.createEsperienzaGroup()); this.currioForm.markAsDirty(); }
  removeEsperienza(index: number): void { this.esperienzeFormArray.removeAt(index); this.currioForm.markAsDirty(); }
  getDettagli(esperienzaIndex: number): FormArray { return this.esperienzeFormArray.at(esperienzaIndex).get('dettagli') as FormArray; }
  addDettaglio(esperienzaIndex: number): void { this.getDettagli(esperienzaIndex).push(this.fb.control('')); this.currioForm.markAsDirty(); }
  removeDettaglio(esperienzaIndex: number, dettaglioIndex: number): void { this.getDettagli(esperienzaIndex).removeAt(dettaglioIndex); this.currioForm.markAsDirty(); }
  getCompetenzeAcquisite(esperienzaIndex: number): FormArray { return this.esperienzeFormArray.at(esperienzaIndex).get('competenzeAcquisite') as FormArray; }
  addCompetenzaAcquisita(esperienzaIndex: number): void { this.getCompetenzeAcquisite(esperienzaIndex).push(this.fb.control('')); this.currioForm.markAsDirty(); }
  removeCompetenzaAcquisita(esperienzaIndex: number, compIndex: number): void { this.getCompetenzeAcquisite(esperienzaIndex).removeAt(compIndex); this.currioForm.markAsDirty(); }

  get competenzeFormArray() { return this.currioForm.get('competenze') as FormArray; }
  createCompetenzaGroup(competenza?: CurrioCompetenza): FormGroup {
    return this.fb.group({
      id: [competenza?.id || uuidv4()],
      nome: [competenza?.nome || '', Validators.required],
      livello: [competenza?.livello || ''],
      icona: [competenza?.icona || '']
    });
  }
  addCompetenza(): void { this.competenzeFormArray.push(this.createCompetenzaGroup()); this.currioForm.markAsDirty(); }
  removeCompetenza(index: number): void { this.competenzeFormArray.removeAt(index); this.currioForm.markAsDirty(); }

  private clearFormArray(formArray: FormArray): void {
    while (formArray.length !== 0) {
      formArray.removeAt(0);
    }
  }

  preparaEInviaInvito(): void {
    if (!this.isUserAdmin || !this.currio || !this.currio.id || !this.currio.datiCliente?.email) {
      Swal.fire('Errore', "Operazione non permessa o dati del curriò/cliente mancanti.", 'error');
      return;
    }

    const token = uuidv4();
    const baseUrl = window.location.origin;
    this.linkRegistrazione = `${baseUrl}/auth/completa-registrazione?token=${token}`;
    this.encodedLinkRegistrazione = encodeURIComponent(this.linkRegistrazione);
    const scadenzaTimestamp = Date.now() + 24 * 60 * 60 * 1000;

    const currioAggiornato: Currio = {
      ...this.currio,
      tokenRegistrazione: token,
      tokenRegistrazioneScadenza: scadenzaTimestamp,
      status: 'invito_spedito',
    };

    this.store.dispatch(updateCurrio({ currio: currioAggiornato }));
    Swal.fire({
      title: 'Link di Registrazione Generato!',
      html: `Per favore, invia il seguente link di registrazione a <strong>${this.currio.datiCliente.email}</strong>:<br><br><div class="input-group input-group-sm"><input type="text" class="form-control form-control-sm" value="${this.linkRegistrazione}" readonly #registrationLinkInputUnified><button class="btn btn-outline-secondary btn-sm" type="button" id="copyLinkBtnUnified"><i class="feather icon-copy"></i> Copia</button></div><br>Il link scadrà tra 24 ore.`,
      icon: 'info',
      confirmButtonText: 'Ok, ho capito',
      didOpen: () => {
        const copyButton = document.getElementById('copyLinkBtnUnified');
        const linkInput = document.querySelector<HTMLInputElement>('#registrationLinkInputUnified');
        if (copyButton && linkInput) {
          copyButton.addEventListener('click', () => {
            this.copyToClipboard(linkInput);
          });
        }
      }
    });
  }

  copyToClipboard(inputElement: HTMLInputElement): void {
    inputElement.select();
    inputElement.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(inputElement.value).then(() => {
       Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Link copiato!', showConfirmButton: false, timer: 1500 });
    }).catch(err => {
      console.error('Errore nel copiare il link:', err);
      Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Errore nel copiare', showConfirmButton: false, timer: 1500 });
    });
  }

  onSubmit(): void {
    if (!this.currioForm.valid) {
      this.currioForm.markAllAsTouched();
      Swal.fire('Attenzione', 'Per favore, correggi gli errori nel form.', 'warning');
      return;
    }

    if (!this.currio || !this.currio.id) {
      Swal.fire('Errore', 'Impossibile salvare, dati Curriò di riferimento mancanti o ID non valido.', 'error');
      return;
    }

    this.store.dispatch(setLoadingSpinner({ status: true }));
    const formValue = this.currioForm.value;

    const currioToUpdate: Currio = {
      ...this.currio,
      id: this.currio.id,
      nomePortfolio: formValue.nomePortfolio,
      heroTitle: formValue.heroTitle,
      heroSubtitle: formValue.heroSubtitle,
      linguaDefault: formValue.linguaDefault,
      templateScelto: formValue.templateScelto,
      chiSonoFotoUrl: formValue.chiSonoFotoUrl,
      chiSonoDescrizione1: formValue.chiSonoDescrizione1,
      chiSonoDescrizione2: formValue.chiSonoDescrizione2,
      contatti: formValue.contatti,
      progetti: formValue.progetti.map((p:CurrioProgetto) => ({...p, id: p.id || uuidv4()})),
      esperienze: formValue.esperienze.map((e:CurrioEsperienza) => ({...e, id: e.id || uuidv4()})),
      competenze: formValue.competenze.map((c:CurrioCompetenza) => ({...c, id: c.id || uuidv4()}))
    };
    this.store.dispatch(updateCurrio({ currio: currioToUpdate }));
  }

  goBack(): void {
    if(this.isUserAdmin) {
      this.router.navigate(['/admin/currio/listacurrio']);
    } else {
      this.router.navigate(['/cliente/dashboard']);
    }
  }

  openPreviewInNewTab(): void {
    if (this.currio && this.currio.id) {
      const url = this.router.serializeUrl(this.router.createUrlTree(['/', this.currio.id]));
      window.open(url, '_blank');
    } else {
      Swal.fire('Errore', "ID Curriò non disponibile per l'anteprima.", 'error');
    }
  }

  openCurriculum(): void {
    if (this.isUserAdmin && this.currio && this.currio.curriculumUrl) {
      window.open(this.currio.curriculumUrl, '_blank');
    } else {
      Swal.fire('Attenzione', 'Nessun CV allegato o operazione non permessa.', 'warning');
    }
  }

  onDeleteCurrio(): void {
    if (this.isUserAdmin && this.currio && this.currio.id) {
      Swal.fire({
        title: 'Sei sicuro?',
        text: "Non potrai annullare questa operazione!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sì, eliminalo!',
        cancelButtonText: 'Annulla'
      }).then((result) => {
        if (result.isConfirmed) {
          this.store.dispatch(deleteCurrio({ id: this.currio!.id! }));
          Swal.fire('Eliminato!', 'Il Curriò è stato eliminato con successo.', 'success')
            .then(() => {
              this.router.navigate(['/admin/currio/listacurrio']);
            });
        }
      });
    } else {
      Swal.fire('Errore', "Operazione non permessa o ID del Curriò non disponibile.", 'error');
    }
  }

   private handleCurrioLoadingError(message: string, error?: any): void {
    console.error(message, error || '');
    Swal.fire('Errore Caricamento', message, 'error');
    this.isLoadingCurrio = false;
    this.store.dispatch(setLoadingSpinner({ status: false }));
    this.store.dispatch(setErrorMessage({ message }));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
