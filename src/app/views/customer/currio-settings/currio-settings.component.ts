
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subscription, of } from 'rxjs';
import { filter, switchMap, take, tap, map } from 'rxjs/operators';
import { AppState } from 'src/app/shared/app.state';
import { User } from 'src/app/shared/models/user.interface';
import { Currio, CurrioProgetto, CurrioEsperienza, CurrioCompetenza } from 'src/app/shared/models/currio.model';
import { getUser } from 'src/app/views/auth/state/auth.selector';
import { getCurrioById, getCurrios, getCurrioLoading, getCurrioError } from 'src/app/views/currio/state/currio.selector';
import { loadCurrios, updateCurrio, updateCurrioSuccess, loadCurrioById } from 'src/app/views/currio/state/currio.action'; // Assicurati di avere loadCurrioById se necessario
import { setLoadingSpinner, setErrorMessage } from 'src/app/shared/store/shared.actions';
import Swal from 'sweetalert2';
import { Actions, ofType } from '@ngrx/effects';

@Component({
  selector: 'app-currio-settings',
  templateUrl: './currio-settings.component.html',
  styleUrls: ['./currio-settings.component.scss']
})
export class CurrioSettingsComponent implements OnInit, OnDestroy {
  currioForm: FormGroup;
  currentCurrio: Currio | undefined | null; // Può essere null inizialmente
  private subscriptions: Subscription = new Subscription();
  currioId: string | undefined;
  isSubmitting$: Observable<boolean>;
  isLoadingCurrio = true; // Flag per il caricamento iniziale del Curriò
  showUnsavedChangesWarning = false;

  constructor(
    private fb: FormBuilder,
    private store: Store<AppState>,
    private actions$: Actions
  ) {
    this.isSubmitting$ = this.store.select(getCurrioLoading);
  }

  ngOnInit(): void {
    this.initForm();
    this.loadUserAndCurrioData();
    this.subscribeToSuccessActions();
    this.subscribeToFormChanges();
  }

  private initForm(): void {
    this.currioForm = this.fb.group({
      nomePortfolio: ['', Validators.required],
      heroTitle: ['', Validators.required],
      heroSubtitle: [''],
      linguaDefault: ['it', Validators.required],
      chiSonoFotoUrl: [''], // Valutare un validatore URL se necessario
      chiSonoDescrizione1: [''],
      chiSonoDescrizione2: [''],
      contatti: this.fb.group({
        email: ['', [Validators.email]],
        github: [''], // Valutare un validatore URL
        linkedin: [''], // Valutare un validatore URL
        instagram: [''] // Valutare un validatore URL
      }),
      progetti: this.fb.array([]),
      esperienze: this.fb.array([]),
      competenze: this.fb.array([])
      // Campi come 'status', 'userId', 'datiCliente' non sono esposti al cliente per la modifica.
    });
  }

  private loadUserAndCurrioData(): void {
    this.isLoadingCurrio = true;
    this.store.dispatch(setLoadingSpinner({ status: true }));

    const userSub = this.store.select(getUser).pipe(
      filter((user): user is User => !!user && !!user.localId), // Assicura che user e user.localId non siano null/undefined
      take(1),
      tap(() => this.store.dispatch(loadCurrios())), // Carica tutti i currios
      switchMap(user =>
        this.store.select(getCurrios).pipe(
          map(currios => currios.find(c => c.userId === user.localId)),
          filter((currio): currio is Currio => !!currio && !!currio.id) // Assicura che currio e currio.id non siano null/undefined
        )
      ),
      take(1)
    ).subscribe({
      next: (foundCurrio) => {
        if (foundCurrio) {
          this.currioId = foundCurrio.id;
          // Dispatch loadCurrioById per assicurarsi che selectedCurrio nello store sia aggiornato
          // e per triggerare il popolamento del form tramite il selettore getCurrioById
          this.store.dispatch(loadCurrioById({ id: this.currioId! }));
          this.subscribeToSpecificCurrio(this.currioId!); // Sottoscrivi dopo aver trovato l'ID
        } else {
          this.handleCurrioLoadingError('Nessun Curriò trovato per questo account.');
        }
      },
      error: (err) => this.handleCurrioLoadingError('Errore durante il recupero del Curriò utente.', err)
    });
    this.subscriptions.add(userSub);
  }

  private subscribeToSpecificCurrio(id: string): void {
    const currioSub = this.store.select(getCurrioById, { id }).pipe(
      filter((currio): currio is Currio => !!currio) //  Continua solo se il currio è definito
    ).subscribe(currioDetails => {
        this.currentCurrio = currioDetails;
        this.initializeFormWithCurrioData(currioDetails);
        this.isLoadingCurrio = false;
        this.store.dispatch(setLoadingSpinner({ status: false }));
    });
    this.subscriptions.add(currioSub);
  }


  private handleCurrioLoadingError(message: string, error?: any): void {
    console.error(message, error || '');
    Swal.fire('Errore', message, 'error');
    this.isLoadingCurrio = false;
    this.store.dispatch(setLoadingSpinner({ status: false }));
    this.store.dispatch(setErrorMessage({ message }));
  }


  private initializeFormWithCurrioData(currio: Currio): void {
    this.currioForm.patchValue({
      nomePortfolio: currio.nomePortfolio || '',
      heroTitle: currio.heroTitle || '',
      heroSubtitle: currio.heroSubtitle || '',
      linguaDefault: currio.linguaDefault || 'it',
      chiSonoFotoUrl: currio.chiSonoFotoUrl || '',
      chiSonoDescrizione1: currio.chiSonoDescrizione1 || '',
      chiSonoDescrizione2: currio.chiSonoDescrizione2 || '',
      contatti: {
        email: currio.contatti?.email || this.currentCurrio?.datiCliente?.email || '', // Prepopola con email cliente se disponibile
        github: currio.contatti?.github || '',
        linkedin: currio.contatti?.linkedin || '',
        instagram: currio.contatti?.instagram || '',
      }
    });

    this.clearAndPopulateFormArray(this.progettiFormArray, currio.progetti, this.createProgettoGroup.bind(this));
    this.clearAndPopulateFormArray(this.esperienzeFormArray, currio.esperienze, this.createEsperienzaGroup.bind(this));
    this.clearAndPopulateFormArray(this.competenzeFormArray, currio.competenze, this.createCompetenzaGroup.bind(this));

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
      // Opzionale: ricaricare i dati se l'effect non lo fa o per UI consistency
      if (this.currioId) {
        this.store.dispatch(loadCurrioById({id: this.currioId}));
      }
    });
    this.subscriptions.add(successSub);
  }

  updateWarningState(): void {
    this.showUnsavedChangesWarning = this.currioForm && this.currioForm.dirty;
  }

  // Metodi per Progetti
  get progettiFormArray() { return this.currioForm.get('progetti') as FormArray; }
  createProgettoGroup(progetto?: CurrioProgetto): FormGroup {
    return this.fb.group({
      id: [progetto?.id || new Date().getTime().toString()], // Aggiungi un ID se non presente
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

  // Metodi per Esperienze
  get esperienzeFormArray() { return this.currioForm.get('esperienze') as FormArray; }
  createEsperienzaGroup(esperienza?: CurrioEsperienza): FormGroup {
    return this.fb.group({
      id: [esperienza?.id || new Date().getTime().toString()],
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

  // Metodi per Competenze
  get competenzeFormArray() { return this.currioForm.get('competenze') as FormArray; }
  createCompetenzaGroup(competenza?: CurrioCompetenza): FormGroup {
    return this.fb.group({
      id: [competenza?.id || new Date().getTime().toString()],
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

  onSubmit(): void {
    if (!this.currioForm.valid) {
      this.currioForm.markAllAsTouched(); // Mostra errori di validazione
      Swal.fire('Attenzione', 'Per favore, correggi gli errori nel form.', 'warning');
      return;
    }
    if (!this.currentCurrio || !this.currioId) {
      Swal.fire('Errore', 'Impossibile salvare, dati Curriò di riferimento mancanti.', 'error');
      return;
    }

    this.store.dispatch(setLoadingSpinner({ status: true }));
    const formValue = this.currioForm.value;

    const currioToUpdate: Currio = {
      ...this.currentCurrio, // Mantiene ID, userId, status, datiCliente, token, etc. originali
      // Sovrascrive solo i campi modificabili dal cliente
      nomePortfolio: formValue.nomePortfolio,
      heroTitle: formValue.heroTitle,
      heroSubtitle: formValue.heroSubtitle,
      linguaDefault: formValue.linguaDefault,
      chiSonoFotoUrl: formValue.chiSonoFotoUrl,
      chiSonoDescrizione1: formValue.chiSonoDescrizione1,
      chiSonoDescrizione2: formValue.chiSonoDescrizione2,
      contatti: formValue.contatti,
      progetti: formValue.progetti.map(p => ({...p, id: p.id || new Date().getTime().toString()})), // Assicura ID
      esperienze: formValue.esperienze.map(e => ({...e, id: e.id || new Date().getTime().toString()})),
      competenze: formValue.competenze.map(c => ({...c, id: c.id || new Date().getTime().toString()}))
    };

    this.store.dispatch(updateCurrio({ currio: currioToUpdate }));
    // Successo gestito da effect
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
