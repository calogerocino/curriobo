import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType, concatLatestFrom } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of, from, forkJoin } from 'rxjs';
import { map, mergeMap, catchError, tap, switchMap, filter, exhaustMap } from 'rxjs/operators';
import { AppState } from 'src/app/shared/app.state';
import { CurrioService } from 'src/app/shared/servizi/currio.service';
import { setLoadingSpinner, setErrorMessage } from 'src/app/shared/store/shared.actions';
import * as CurrioActions from './currio.action';
import { Router } from '@angular/router';
import { Currio } from 'src/app/shared/models/currio.model';
import { getCurrioById } from './currio.selector'; // Assicurati che questo selettore esista e funzioni
import { UserService } from 'src/app/shared/servizi/user.service'; // Importa UserService
// import { AuthService } from 'src/app/shared/servizi/auth.service'; // Importa AuthService se tenterai l'eliminazione Auth
import Swal from 'sweetalert2';


@Injectable()
export class CurrioEffects {
  constructor(
    private readonly actions$: Actions,
    private readonly currioService: CurrioService,
    private readonly store: Store<AppState>,
    private readonly userService: UserService, // Inietta UserService
    // private readonly authService: AuthService, // Inietta AuthService se necessario
    private readonly router: Router // Inietta Router se serve per navigazione post-eliminazione
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
      this.store.dispatch(setLoadingSpinner({ status: true }));
    }),
    mergeMap((action) => {
      return this.currioService.getCurrioById(action.id).pipe(
        map((currio) => {
          this.store.dispatch(setLoadingSpinner({ status: false }));
          return CurrioActions.loadCurrioByIdSuccess({ currio: currio as Currio });
        }),
        catchError(err => {
          this.store.dispatch(setLoadingSpinner({ status: false }));
          const message = `Errore nel caricamento del Curriò con ID: ${action.id}`;
          this.store.dispatch(setErrorMessage({ message }));
          return of(CurrioActions.loadCurrioByIdFailure({ error: err.message || 'Errore sconosciuto servizio' }));
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
      // Utilizza concatLatestFrom per ottenere l'oggetto Curriò corrente dallo store
      concatLatestFrom(action =>
        this.store.select(getCurrioById, { id: action.id }).pipe(
          filter(currio => !!currio) // Assicurati che il currio esista prima di procedere
        )
      ),
      exhaustMap(([action, currioToDelete]) => {
        if (!currioToDelete) {
          const errorMsg = `Curriò con ID ${action.id} non trovato per l'eliminazione completa.`;
          console.error(errorMsg);
          this.store.dispatch(setErrorMessage({ message: errorMsg }));
          return of(CurrioActions.deleteCurrioFailure({ error: errorMsg }));
        }

        this.store.dispatch(setLoadingSpinner({ status: true }));

        const deletePromises: Promise<any>[] = [];
        let filesToDelete: string[] = [];

        // Colleziona URL dei file da eliminare
        if (currioToDelete.curriculumUrl) {
          filesToDelete.push(currioToDelete.curriculumUrl);
        }
        if (currioToDelete.chiSonoFotoUrl) {
          filesToDelete.push(currioToDelete.chiSonoFotoUrl);
        }
        currioToDelete.progetti?.forEach(progetto => {
          if (progetto.immagineUrl) {
            filesToDelete.push(progetto.immagineUrl);
          }
        });

        // Aggiungi promesse per l'eliminazione dei file
        filesToDelete.forEach(fileUrl => {
          deletePromises.push(
            this.currioService.deleteFileByUrl(fileUrl).catch(err => {
              console.error(`[CurrioEffects] Errore eliminazione file ${fileUrl} da Storage:`, err);
              // Non bloccare l'intero processo, ma logga l'errore.
              // Potresti voler accumulare questi errori per mostrarli all'utente.
            })
          );
        });

        // Aggiungi promessa per eliminare dati utente da Firestore (se userId esiste)
        if (currioToDelete.userId) {
          deletePromises.push(
            this.userService.deleteFirestoreUser(currioToDelete.userId).catch(err => {
              console.error(`[CurrioEffects] Errore eliminazione utente ${currioToDelete.userId} da Firestore:`, err);
            })
          );

          // ELIMINAZIONE UTENTE DA FIREBASE AUTH (RICHIEDE BACKEND/CLOUD FUNCTION)
          // console.warn(`[CurrioEffects] L'eliminazione dell'utente ${currioToDelete.userId} da Firebase Authentication richiede un'implementazione backend/Cloud Function con Admin SDK per motivi di sicurezza e permessi. Questa operazione non verrà eseguita dal client.`);
          // Se avessi una Cloud Function, potresti invocarla qui.
          // Esempio: deletePromises.push(this.functions.httpsCallable('deleteUser')({ uid: currioToDelete.userId }).toPromise());
        }

        // Esegui tutte le promesse di eliminazione (file, dati Firestore)
        return from(Promise.all(deletePromises)).pipe(
          mergeMap(() =>
            // Dopo che le eliminazioni secondarie sono state tentate (con o senza errori individuali),
            // procedi con l'eliminazione del Curriò dal Realtime Database.
            this.currioService.deleteCurrio(action.id).pipe(
              map(() => {
                this.store.dispatch(setLoadingSpinner({ status: false }));
                Swal.fire('Eliminato!', 'Il Curriò e i dati associati (dove possibile da client) sono stati elaborati per l\'eliminazione.', 'success');
                return CurrioActions.deleteCurrioSuccess({ id: action.id });
              }),
              catchError(rtdbErr => {
                this.store.dispatch(setLoadingSpinner({ status: false }));
                const message = `Errore durante l'eliminazione del Curriò ${action.id} dal Realtime Database.`;
                this.store.dispatch(setErrorMessage({ message: message + " Dettagli: " + rtdbErr.message }));
                return of(CurrioActions.deleteCurrioFailure({ error: message + " " + rtdbErr }));
              })
            )
          ),
          catchError(err => { // Errore generale da Promise.all (se una delle promesse principali fallisce e non viene gestita individualmente)
            this.store.dispatch(setLoadingSpinner({ status: false }));
            const message = `Si sono verificati errori durante l'eliminazione dei dati associati al Curriò ${action.id}. Alcuni dati potrebbero non essere stati eliminati. Controllare la console per dettagli.`;
            this.store.dispatch(setErrorMessage({ message: message + " Dettagli: " + err.message }));
            // Nonostante gli errori, si potrebbe voler comunque tentare l'eliminazione del Curriò principale.
            // Oppure, considerare l'intera operazione fallita. Per ora, l'errore qui blocca l'eliminazione RTDB.
            // Se si vuole che l'eliminazione RTDB avvenga comunque, la logica qui dovrebbe essere diversa.
            // Data la gestione degli errori individuali nelle promesse, questo catchError potrebbe non essere triggerato
            // a meno che una promessa non gestita internamente rigetti.
            Swal.fire('Errore Eliminazione', message, 'error');
            return of(CurrioActions.deleteCurrioFailure({ error: message + " " + err }));
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
            return of(); // O un'azione di fallimento specifica se definita
          })
        );
      })
    );
  });
}
