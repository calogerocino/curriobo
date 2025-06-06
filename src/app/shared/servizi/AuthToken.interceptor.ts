import { exhaustMap, take } from 'rxjs/operators';
import { getUserToken } from 'src/app/views/auth/state/auth.selector';
import { AppState } from '../app.state';
import { Store } from '@ngrx/store';
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpEvent,
  HttpHandler,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
  constructor(private readonly store: Store<AppState>) {}
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return this.store.select(getUserToken).pipe(
      take(1),
      exhaustMap((token) => {
        // Se non c'è un token o la richiesta non è per il nostro database Firebase,
        // inoltra la richiesta senza modificarla.
        if (!token || !req.url.includes(environment.firebase.databaseURL)) {
          return next.handle(req);
        }

        // Se la richiesta è per il database Firebase, aggiungi il token.
        let modifiedReq = req.clone({
          params: req.params.append('auth', token),
        });
        return next.handle(modifiedReq);
      })
    );
  }
}
