import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType, concatLatestFrom } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of, from, forkJoin, Observable } from 'rxjs'; // Observable aggiunto
import {
  map,
  mergeMap,
  catchError,
  tap,
  switchMap,
  filter,
  exhaustMap,
  take,
} from 'rxjs/operators'; // take aggiunto
import { AppState } from 'src/app/shared/app.state';
import { CurrioService } from 'src/app/shared/servizi/currio.service';
import {
  setLoadingSpinner,
  setErrorMessage,
} from 'src/app/shared/store/shared.actions';
import * as CurrioActions from './currio.action';
import { Router } from '@angular/router';
import { Currio } from 'src/app/shared/models/currio.model';
import { getCurrioById } from './currio.selector';
import { UserService } from 'src/app/shared/servizi/user.service';
import { AuthService } from 'src/app/shared/servizi/auth.service'; // Importa AuthService
import Swal from 'sweetalert2';

@Injectable()
export class CurrioEffects {
  constructor(
    private readonly actions$: Actions,
    private readonly currioService: CurrioService,
    private readonly store: Store<AppState>,
    private readonly userService: UserService,
    private readonly authService: AuthService, // Inietta AuthService
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
            return CurrioActions.loadCurriosSuccess({
              currios: currios as Currio[],
            });
          }),
          catchError((err) => {
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
        // Rimosso il log che non serve più
        this.store.dispatch(setLoadingSpinner({ status: true }));
      }),
      mergeMap((action) => {
        return this.currioService.getCurrioById(action.id).pipe(
          map((currio) => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            // Gestione del caso in cui currio sia undefined ma l'ID corrisponda a quello richiesto
            if (!currio && action.id) {
              console.warn(
                `[CurrioEffects loadCurrioById$] Curriò con ID ${action.id} non trovato dal servizio, ma ID era presente nella richiesta.`
              );
              // Potresti voler dispatchare un errore qui o lasciare che il reducer gestisca un currio null/undefined
              // Per ora, si procede come se fosse un successo con currio undefined, il reducer gestirà l'aggiornamento dello stato.
            }
            return CurrioActions.loadCurrioByIdSuccess({
              currio: currio as Currio,
            });
          }),
          catchError((err) => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            const message = `Errore nel caricamento del Curriò con ID: ${action.id}`;
            this.store.dispatch(setErrorMessage({ message }));
            return of(
              CurrioActions.loadCurrioByIdFailure({
                error: err.message || 'Errore sconosciuto servizio',
              })
            );
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
            const createdCurrio: Currio = {
              ...action.currio,
              id: response.name,
            };
            Swal.fire(
              'Creato!',
              'Il Curriò è stato creato con successo.',
              'success'
            ); // Aggiunto feedback
            return CurrioActions.createCurrioSuccess({ currio: createdCurrio });
          }),
          catchError((err) => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            this.store.dispatch(
              setErrorMessage({ message: 'Errore nella creazione del Curriò' })
            );
            Swal.fire('Errore', 'Impossibile creare il Curriò.', 'error'); // Aggiunto feedback
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
        return this.currioService
          .updateCurrio({ id, ...dataToUpdate } as any)
          .pipe(
            map((data: Currio) => {
              // Utilizza 'data', che è la risposta del server
              this.store.dispatch(setLoadingSpinner({ status: false }));
              Swal.fire(
                'Aggiornato!',
                'Il Curriò è stato aggiornato con successo.',
                'success'
              );
              // Passa il 'currio' aggiornato restituito dal server all'azione di successo
              return CurrioActions.updateCurrioSuccess({
                currio: { id: action.currio.id, changes: dataToUpdate },
              });
            }),
            catchError((err) => {
              this.store.dispatch(setLoadingSpinner({ status: false }));
              this.store.dispatch(
                setErrorMessage({
                  message: "Errore nell'aggiornamento del Curriò",
                })
              );
              Swal.fire('Errore', 'Impossibile aggiornare il Curriò.', 'error'); // Aggiunto feedback
              return of(CurrioActions.updateCurrioFailure({ error: err }));
            })
          );
      })
    );
  });

  deleteCurrio$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CurrioActions.deleteCurrio),
      concatLatestFrom((action) =>
        this.store
          .select(getCurrioById, { id: action.id })
          .pipe
          // Non filtrare qui se currio è null, potremmo non averlo nello store ma esistere nel DB
          // La gestione di currioToDelete nullo sarà fatta dopo.
          ()
      ),
      exhaustMap(([action, currioToDeleteFromStore]) => {
        // Se currioToDeleteFromStore è null, potremmo provare a recuperarlo direttamente per sicurezza,
        // o procedere basandoci sull'ID se siamo sicuri che l'userId sia nel payload di `action` o recuperabile altrimenti.
        // Per ora, assumiamo che se è nello store, contiene i dati necessari.
        // Se non è nello store, l'ID è in action.id, ma userId e file del currio non sarebbero noti.
        // Questa logica assume che currioToDeleteFromStore sia la fonte autoritativa per le URL dei file.

        const currioId = action.id;
        if (!currioToDeleteFromStore && !currioId) {
          // Se non abbiamo né l'oggetto né un ID, non possiamo fare nulla
          const errorMsg = `Impossibile procedere con l'eliminazione: ID Curriò mancante.`;
          console.error(errorMsg);
          this.store.dispatch(setErrorMessage({ message: errorMsg }));
          return of(CurrioActions.deleteCurrioFailure({ error: errorMsg }));
        }

        this.store.dispatch(setLoadingSpinner({ status: true }));

        const currioFilesToDeletePromises: Promise<any>[] = [];

        if (currioToDeleteFromStore) {
          if (currioToDeleteFromStore.curriculumUrl) {
            currioFilesToDeletePromises.push(
              this.currioService
                .deleteFileByUrl(currioToDeleteFromStore.curriculumUrl)
                .catch((err) => {
                  console.warn(
                    `[CurrioEffects] Errore eliminazione curriculum ${currioToDeleteFromStore.curriculumUrl}:`,
                    err
                  );
                })
            );
          }
          if (currioToDeleteFromStore.chiSonoFotoUrl) {
            currioFilesToDeletePromises.push(
              this.currioService
                .deleteFileByUrl(currioToDeleteFromStore.chiSonoFotoUrl)
                .catch((err) => {
                  console.warn(
                    `[CurrioEffects] Errore eliminazione foto chiSono ${currioToDeleteFromStore.chiSonoFotoUrl}:`,
                    err
                  );
                })
            );
          }
          currioToDeleteFromStore.progetti?.forEach((progetto) => {
            if (progetto.immagineUrl) {
              currioFilesToDeletePromises.push(
                this.currioService
                  .deleteFileByUrl(progetto.immagineUrl)
                  .catch((err) => {
                    console.warn(
                      `[CurrioEffects] Errore eliminazione immagine progetto ${progetto.immagineUrl}:`,
                      err
                    );
                  })
              );
            }
          });
        }

        let userRelatedCleanup$: Observable<any> = of(null); // Inizia come un no-op

        const userIdToDelete = currioToDeleteFromStore?.userId;

        if (userIdToDelete) {
          userRelatedCleanup$ = this.userService.getFFUser(userIdToDelete).pipe(
            take(1),
            switchMap((userDoc) => {
              const userSpecificDeletePromises: Promise<any>[] = [];
              if (
                userDoc &&
                userDoc.photoURL &&
                userDoc.photoURL !== this.authService.DEFAULT_AVATAR_URL
              ) {
                // Confronta con default avatar
                console.log(
                  `[CurrioEffects deleteCurrio$] Pianificata eliminazione immagine profilo utente: ${userDoc.photoURL}`
                );
                userSpecificDeletePromises.push(
                  this.currioService
                    .deleteFileByUrl(userDoc.photoURL)
                    .catch((err) => {
                      console.warn(
                        `[CurrioEffects] Fallita eliminazione immagine profilo ${userDoc.photoURL}:`,
                        err
                      );
                    })
                );
              }

              console.log(
                `[CurrioEffects deleteCurrio$] Pianificata eliminazione dati utente Firestore: ${userIdToDelete}`
              );
              userSpecificDeletePromises.push(
                this.userService
                  .deleteFirestoreUser(userIdToDelete)
                  .catch((err) => {
                    console.warn(
                      `[CurrioEffects] Fallita eliminazione utente Firestore ${userIdToDelete}:`,
                      err
                    );
                  })
              );

              // NOTA: L'eliminazione dell'utente da Firebase Authentication (authService.afAuth.deleteUser o simile)
              // richiede privilegi elevati e di solito viene gestita da una Cloud Function per sicurezza.
              // console.warn(`[CurrioEffects] L'eliminazione dell'utente ${userIdToDelete} da Firebase Authentication richiede un'implementazione backend.`);

              return from(Promise.all(userSpecificDeletePromises));
            }),
            catchError((err) => {
              console.error(
                `[CurrioEffects] Errore nel recuperare l'utente ${userIdToDelete} per la pulizia (es. immagine profilo):`,
                err
              );
              // Se il recupero dell'utente fallisce, potremmo non essere in grado di eliminare la sua photoURL.
              // Si potrebbe comunque tentare di eliminare il documento utente Firestore per ID se necessario,
              // ma la logica attuale lo fa già all'interno dello switchMap. Qui ritorniamo of(null) per non bloccare
              // l'eliminazione del Curriò principale.
              return of(null);
            })
          );
        }

        return from(Promise.all(currioFilesToDeletePromises)).pipe(
          switchMap(() => userRelatedCleanup$),
          switchMap(() => this.currioService.deleteCurrio(currioId)), // Usa currioId dall'azione originale
          map(() => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            Swal.fire(
              'Eliminato!',
              "Il Curriò e i dati associati (dove possibile dal client) sono stati elaborati per l'eliminazione.",
              'success'
            );
            return CurrioActions.deleteCurrioSuccess({ id: currioId });
          }),
          catchError((err) => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            const message = `Errore complesso durante l'eliminazione del Curriò ${currioId} e/o dei dati associati.`;
            this.store.dispatch(
              setErrorMessage({
                message: message + ' Dettagli: ' + err.message,
              })
            );
            Swal.fire('Errore Eliminazione', message, 'error');
            return of(
              CurrioActions.deleteCurrioFailure({ error: message + ' ' + err })
            );
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
          catchError((err) => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            this.store.dispatch(
              setErrorMessage({
                message: 'Errore nel caricamento delle richieste Curriò',
              })
            );
            return of(CurrioActions.loadCurriosFailure({ error: err })); // Usiamo loadCurriosFailure per semplicità o creane uno dedicato
          })
        );
      })
    );
  });
}
