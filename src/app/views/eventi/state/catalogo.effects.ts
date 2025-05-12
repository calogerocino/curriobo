import { map, mergeMap, switchMap } from 'rxjs/operators';
import { addEvent, addEventSuccess, deleteEvent, deleteEventSuccess, loadEvents, loadEventsSuccess, updateEvent, updateEventSuccess } from './catalogo.action';
 import { EventsService } from 'src/app/shared/servizi/eventi.service';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Injectable } from '@angular/core';

@Injectable()
export class CatalogoEffects {
  constructor(
    private readonly actions$: Actions,
    private readonly productsService: EventsService
  ) {}

  loadEvents$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(loadEvents),
      mergeMap((action) => {
        return this.productsService.getEvents().pipe(
          map((events) => {
            return loadEventsSuccess({ events });
          })
        );
      })
    );
  });

  addEvent$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(addEvent),
      mergeMap((action) => this.productsService.addEvent(action.event).pipe(
        map((data) => {
          const event = { ...action.event, id: data.name };
          return addEventSuccess({ event });
        })
      ))
    );
  });

   updateEvent$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(updateEvent),
      switchMap((action) => {
        return this.productsService.updateEvent(action.event).pipe(
          map((data) => {
            return updateEventSuccess({ event: action.event });
          })
        );
      })
    );
  });
  deleteEvent$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(deleteEvent),
      switchMap((action) => {
        return this.productsService.deleteEvent(action.id).pipe(
          map((data) => {
            return deleteEventSuccess({ id: action.id });
          })
        );
      })
    );
  });

}
