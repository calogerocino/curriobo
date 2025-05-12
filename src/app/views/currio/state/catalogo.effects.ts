import { map, mergeMap, switchMap, catchError, tap } from 'rxjs/operators'; // Aggiungi catchError
import { of } from 'rxjs'; // Aggiungi of
import {
  loadEvents,
  loadEventsSuccess,
  loadCurrioSubmissions,           // << AGGIUNGI
  loadCurrioSubmissionsSuccess,    // << AGGIUNGI
  // deleteCurrioSubmission,       // Esempio
  // deleteCurrioSubmissionSuccess // Esempio
} from './catalogo.action';
import { EventsService } from 'src/app/shared/servizi/currio.service';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store'; // Importa Store
import { AppState } from 'src/app/shared/app.state'; // Importa AppState
import { setLoadingSpinner, setErrorMessage } from 'src/app/shared/store/shared.actions'; // Per gestione errori/loading

@Injectable()
export class CatalogoEffects {
  constructor(
    private readonly actions$: Actions,
    private readonly eventsService: EventsService, // Nome del servizio
    private readonly store: Store<AppState> // Inietta Store
  ) {}

  loadEvents$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(loadEvents),
      tap(() => this.store.dispatch(setLoadingSpinner({ status: true }))), // Opzionale: loading
      mergeMap(() => { // 'action' non è usato qui
        return this.eventsService.getEvents().pipe(
          map((events) => {
            this.store.dispatch(setLoadingSpinner({ status: false })); // Opzionale: loading
            return loadEventsSuccess({ events });
          }),
          catchError(err => { // Opzionale: gestione errori
            this.store.dispatch(setLoadingSpinner({ status: false }));
            this.store.dispatch(setErrorMessage({ message: 'Errore nel caricamento currio' }));
            return of(); // O un'azione di fallimento specifica
          })
        );
      })
    );
  });

  // addEvent$ = createEffect(() => {
  //   return this.actions$.pipe(
  //     ofType(addEvent),
  //     // ... (codice esistente)
  //   );
  // });

  // updateEvent$ = createEffect(() => {
  //   return this.actions$.pipe(
  //     ofType(updateEvent),
  //     // ... (codice esistente)
  //   );
  // });

  // deleteEvent$ = createEffect(() => {
  //   return this.actions$.pipe(
  //     ofType(deleteEvent),
  //     // ... (codice esistente)
  //   );
  // });

  // << NUOVO EFFETTO PER CURRIO SUBMISSIONS >>
  loadCurrioSubmissions$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(loadCurrioSubmissions),
      tap(() => this.store.dispatch(setLoadingSpinner({ status: true }))), // Opzionale: loading
      mergeMap(() => { // 'action' non è usato qui
        return this.eventsService.getCurrioSubmissions().pipe(
          map((submissions) => {
            this.store.dispatch(setLoadingSpinner({ status: false })); // Opzionale: loading
            return loadCurrioSubmissionsSuccess({ submissions });
          }),
          catchError(err => { // Opzionale: gestione errori
            this.store.dispatch(setLoadingSpinner({ status: false }));
            this.store.dispatch(setErrorMessage({ message: 'Errore nel caricamento delle richieste Curriò' }));
            return of(); // O un'azione di fallimento specifica
          })
        );
      })
    );
  });

  // Aggiungere qui effetti per deleteCurrioSubmission se implementato
}
