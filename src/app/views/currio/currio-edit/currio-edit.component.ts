import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray, FormBuilder } from '@angular/forms';
import { Currio, CurrioContatti } from 'src/app/shared/models/currio.model';
import { getCurrioById } from '../state/currio.selector';
import { AppState } from 'src/app/shared/app.state';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription, filter } from 'rxjs';
// Importa le azioni NGRX per creare/aggiornare
import { createCurrio, updateCurrio, loadCurrios } from '../state/currio.action';

@Component({
  selector: 'app-currio-edit',
  templateUrl: './currio-edit.component.html',
  styleUrls: ['./currio-edit.component.scss'],
})
export class CurrioEditComponent implements OnInit, OnDestroy {
  currio: Currio | undefined;
  currioForm: FormGroup;
  private currioSubscription: Subscription;
  private routeSubscription: Subscription;
  isEditMode = false;
  currioId: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly store: Store<AppState>,
    private readonly router: Router,
    private readonly fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      this.currioId = params.get('id');
      if (this.currioId && this.currioId !== 'new') {
        this.isEditMode = true;
        this.store.dispatch(loadCurrios()); // Assicura che i dati siano caricati (o usa un loadCurrio({id: this.currioId}))
        this.currioSubscription = this.store
          .select(getCurrioById, { id: this.currioId })
          .pipe(filter(data => !!data)) // Filtra emissioni null/undefined iniziali
          .subscribe((data) => {
            this.currio = data as Currio; // Cast a Currio
            this.initializeForm();
          });
      } else {
        this.isEditMode = false;
        this.currio = this.getEmptyCurrio();
        this.initializeForm();
      }
    });
  }

  getEmptyCurrio(): Currio {
    return {
      id: '', // Sarà generato dal backend/Firebase
      nomePortfolio: '',
      heroTitle: '',
      heroSubtitle: '',
      linguaDefault: 'it',
      contatti: { email: '', github: '', linkedin: ''},
      progetti: [],
      esperienze: [],
      competenze: [],
      chiSonoDescrizione1: '',
    } as Currio;
  }

  initializeForm(): void {
    this.currioForm = this.fb.group({
      nomePortfolio: [this.currio?.nomePortfolio || '', Validators.required],
      heroTitle: [this.currio?.heroTitle || '', Validators.required],
      heroSubtitle: [this.currio?.heroSubtitle || ''],
      linguaDefault: [this.currio?.linguaDefault || 'it', Validators.required],
      chiSonoFotoUrl: [this.currio?.chiSonoFotoUrl || ''],
      chiSonoDescrizione1: [this.currio?.chiSonoDescrizione1 || ''],
      chiSonoDescrizione2: [this.currio?.chiSonoDescrizione2 || ''],
      contatti: this.fb.group({
        email: [this.currio?.contatti?.email || '', [Validators.required, Validators.email]],
        github: [this.currio?.contatti?.github || ''],
        linkedin: [this.currio?.contatti?.linkedin || ''],
        instagram: [this.currio?.contatti?.instagram || ''],
      }),
      // TODO: Inizializzare FormArray per progetti, esperienze, competenze
      // progetti: this.fb.array(this.currio?.progetti?.map(p => this.createProgettoGroup(p)) || []),
      // esperienze: this.fb.array(this.currio?.esperienze?.map(e => this.createEsperienzaGroup(e)) || []),
    });
  }

  // Metodi per FormArray (da implementare se necessario)
  // createProgettoGroup(progetto?: CurrioProgetto): FormGroup { /* ... */ }
  // addProgetto(): void { /* ... */ }
  // removeProgetto(index: number): void { /* ... */ }

  onSubmit(): void {
    if (!this.currioForm.valid) {
      this.currioForm.markAllAsTouched();
      return;
    }

    const formValue = this.currioForm.value;
    const currioToSave: Currio = {
      ...this.currio, // Mantiene l'ID originale e altri dati non nel form (se presenti)
      id: this.isEditMode && this.currio ? this.currio.id : undefined, // L'ID per Firebase viene gestito diversamente in creazione vs update
      ...formValue,
    };

    if (this.isEditMode && currioToSave.id) {
      // L'azione di NGRX dovrebbe prendere l'intero oggetto Currio
      // Firebase richiede l'ID nel path e i dati da aggiornare nel body,
      // quindi l'effetto NGRX gestirà questa logica.
      this.store.dispatch(updateCurrio({ currio: currioToSave as any }));
      console.log("Dispatch Update:", currioToSave);
    } else {
      // Per la creazione, Firebase genererà un ID. L'oggetto non dovrebbe avere un 'id' definito.
      const { id, ...currioDataToCreate } = currioToSave; // Rimuovi l'id se presente
      this.store.dispatch(createCurrio({ currio: currioDataToCreate as any }));
      console.log("Dispatch Create:", currioDataToCreate);
    }

    this.router.navigate(['/admin/currio/listacurrio']);
  }

  goBack(): void {
    this.router.navigate(['/admin/currio/listacurrio']);
  }

  openPreviewInNewTab(): void {
    if (this.currio && this.currio.id) {
      // Qui dovresti costruire l'URL per l'anteprima del Currio.
      // Questo potrebbe essere un'altra rotta Angular o un link diretto se l'HTML è generato staticamente.
      // Esempio (ipotetico, dovrai creare questa rotta/logica):
      // const previewUrl = this.router.serializeUrl(this.router.createUrlTree(['/currio/view', this.currio.id]));
      // window.open(previewUrl, '_blank');
      alert("Funzionalità di anteprima in nuova scheda da implementare. Dovresti creare una pagina di visualizzazione per il Curriò.");

      // Per ora, puoi loggare i dati del currio per vedere cosa verrebbe visualizzato
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
