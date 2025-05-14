// src/app/views/customer/account/account.component.ts
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { map, Observable } from 'rxjs';
import { AppState } from 'src/app/shared/app.state';
import { User } from 'src/app/shared/models/user.interface';
import { getUser } from 'src/app/views/auth/state/auth.selector'; // Stesso selettore va bene
import { autologout } from 'src/app/views/auth/state/auth.action'; // Importa l'azione di logout

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  // styleUrls: ['./account.component.scss']
})
export class CustomerAccountComponent implements OnInit {
  currentUserEmail$: Observable<string | undefined>; // Osservabile per l'email

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.currentUserEmail$ = this.store.select(getUser).pipe(
      map(user => user?.email) // Estrae solo l'email dall'oggetto utente
    );
  }

   logout(): void {
    this.store.dispatch(autologout());
  }
}
