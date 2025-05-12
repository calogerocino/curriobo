import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, mergeMap, catchError, tap, switchMap } from 'rxjs/operators';
import { AppState } from 'src/app/shared/app.state';
// Rinomina EventsService in CurrioService
import { CurrioService } from 'src/app/shared/servizi/currio.service';
import { setLoadingSpinner, setErrorMessage } from 'src/app/shared/store/shared.actions';
import * as CurrioActions from './currio.action';
import { Router } from '@angular/router';
import { Currio } from 'src/app/shared/models/currio.model';


@Injectable()
export class CurrioEffects { // Rinomina da CatalogoEffects
  constructor(
    private readonly actions$: Actions,
    private readonly currioService: CurrioService, // Servizio rinominato
    private readonly store: Store<AppState>,
    private readonly router: Router
  ) {}

  loadCurrios$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CurrioActions.loadCurrios), // Usa l'azione corretta
      tap(() => this.store.dispatch(setLoadingSpinner({ status: true }))),
      mergeMap(() => {
        return this.currioService.getCurrios().pipe( // Dovrai creare getCurrios() nel servizio
          map((currios) => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            return CurrioActions.loadCurriosSuccess({ currios: currios as Currio[] }); // Cast se il servizio ritorna Event[]
          }),
          catchError(err => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            const message = err.message || 'Errore nel caricamento dei Curriò';
            this.store.dispatch(setErrorMessage({ message }));
            return of(CurrioActions.loadCurriosFailure({ error: err }));
          })
        );
      })
    );
  });

  // Opzionale: Carica un singolo currio se necessario
  loadCurrioById$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CurrioActions.loadCurrioById),
      tap(() => this.store.dispatch(setLoadingSpinner({ status: true }))),
      mergeMap((action) => {
        // Assumi che esista un metodo getEvent(id) nel servizio che restituisce un singolo Currio/Event
        return this.currioService.getCurrioById(action.id).pipe( // Dovrai creare getCurrioById(id) nel servizio
          map((currio) => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            return CurrioActions.loadCurrioByIdSuccess({ currio: currio as Currio });
          }),
          catchError(err => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            const message = `Errore nel caricamento del Curriò con ID: ${action.id}`;
            this.store.dispatch(setErrorMessage({ message }));
            return of(CurrioActions.loadCurrioByIdFailure({ error: err }));
          })
        );
      })
    );
  });

  createCurrio$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CurrioActions.createCurrio),
      tap(() => this.store.dispatch(setLoadingSpinner({ status: true }))),
      switchMap((action) => {
        // Il tuo servizio deve avere un metodo per creare un Currio.
        // Firebase tipicamente restituisce un oggetto { name: <ID_GENERATO> }
        // Dovrai poi aggiornare il currio creato con l'ID restituito.
        return this.currioService.createCurrio(action.currio as any).pipe( // Usa createCurrio(data) nel servizio
          map((response) => { // response potrebbe essere { name: string } da Firebase
            this.store.dispatch(setLoadingSpinner({ status: false }));
            const createdCurrio: Currio = { ...action.currio, id: response.name }; // Aggiungi l'ID restituito
            return CurrioActions.createCurrioSuccess({ currio: createdCurrio });
          }),
          catchError(err => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            this.store.dispatch(setErrorMessage({ message: 'Errore nella creazione del Curriò' }));
            return of(CurrioActions.createCurrioFailure({ error: err }));
          })
        );
      })
    );
  });

  updateCurrio$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CurrioActions.updateCurrio),
      tap(() => this.store.dispatch(setLoadingSpinner({ status: true }))),
      switchMap((action) => {
        // Il servizio deve avere un metodo per aggiornare un Currio.
        // Firebase per l'update non restituisce il corpo intero, solo una conferma o errore.
        const { id, ...dataToUpdate } = action.currio;
        return this.currioService.updateCurrio({ id, ...dataToUpdate } as any).pipe(
          map(() => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            // L'aggiornamento nello store avviene tramite il reducer
            // L'azione di successo potrebbe passare le modifiche per NgRx Data/Entity o l'ID
            return CurrioActions.updateCurrioSuccess({ currio: { id: action.currio.id, changes: dataToUpdate }});
          }),
          catchError(err => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            this.store.dispatch(setErrorMessage({ message: 'Errore nell\'aggiornamento del Curriò' }));
            return of(CurrioActions.updateCurrioFailure({ error: err }));
          })
        );
      })
    );
  });

  deleteCurrio$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CurrioActions.deleteCurrio),
      tap(() => this.store.dispatch(setLoadingSpinner({ status: true }))),
      mergeMap((action) => {
        return this.currioService.deleteCurrio(action.id).pipe(
          map(() => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            return CurrioActions.deleteCurrioSuccess({ id: action.id });
          }),
          catchError(err => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            this.store.dispatch(setErrorMessage({ message: 'Errore nell\'eliminazione del Curriò' }));
            return of(CurrioActions.deleteCurrioFailure({ error: err }));
          })
        );
      })
    );
  });

  // Effetto per CurrioSubmissions (già esistente, verifica nome e servizio)
  loadCurrioSubmissions$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CurrioActions.loadCurrioSubmissions),
      tap(() => this.store.dispatch(setLoadingSpinner({ status: true }))),
      mergeMap(() => {
        return this.currioService.getCurrioSubmissions().pipe(
          map((submissions) => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            return CurrioActions.loadCurrioSubmissionsSuccess({ submissions });
          }),
          catchError(err => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            this.store.dispatch(setErrorMessage({ message: 'Errore nel caricamento delle richieste Curriò' }));
            return of();
          })
        );
      })
    );
  });
}
