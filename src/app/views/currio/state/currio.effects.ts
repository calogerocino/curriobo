import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, mergeMap, catchError, tap, switchMap } from 'rxjs/operators';
import { AppState } from 'src/app/shared/app.state';
import { CurrioService } from 'src/app/shared/servizi/currio.service';
import { setLoadingSpinner, setErrorMessage } from 'src/app/shared/store/shared.actions';
import * as CurrioActions from './currio.action';
import { Router } from '@angular/router';
import { Currio } from 'src/app/shared/models/currio.model';


@Injectable()
export class CurrioEffects {
  constructor(
    private readonly actions$: Actions,
    private readonly currioService: CurrioService,
    private readonly store: Store<AppState>,
    private readonly router: Router
  ) {}

  loadCurrios$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CurrioActions.loadCurrios),
      tap(() => this.store.dispatch(setLoadingSpinner({ status: true }))),
      mergeMap(() => {
        return this.currioService.getCurrios().pipe(
          map((currios) => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            return CurrioActions.loadCurriosSuccess({ currios: currios as Currio[] });
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

loadCurrioById$ = createEffect(() => {
  return this.actions$.pipe(
    ofType(CurrioActions.loadCurrioById),
    tap((action) => {
      console.log('[Effect] loadCurrioById action received:', action); // LOG
      this.store.dispatch(setLoadingSpinner({ status: true }));
    }),
    mergeMap((action) => {
      console.log('[Effect] Calling currioService.getCurrioById with ID:', action.id); // LOG
      return this.currioService.getCurrioById(action.id).pipe(
        map((currio) => {
          console.log('[Effect] currioService.getCurrioById success, data:', currio); // LOG
          this.store.dispatch(setLoadingSpinner({ status: false }));
          return CurrioActions.loadCurrioByIdSuccess({ currio: currio as Currio });
        }),
        catchError(err => {
          console.error('[Effect] currioService.getCurrioById error:', err); // LOG
          this.store.dispatch(setLoadingSpinner({ status: false }));
          const message = `Errore nel caricamento del Curriò con ID: ${action.id}`;
          this.store.dispatch(setErrorMessage({ message }));
          return of(CurrioActions.loadCurrioByIdFailure({ error: err.message || 'Errore sconosciuto servizio' })); // Assicurati di passare un payload di errore valido
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
        return this.currioService.createCurrio(action.currio as any).pipe(
          map((response) => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            const createdCurrio: Currio = { ...action.currio, id: response.name };
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
