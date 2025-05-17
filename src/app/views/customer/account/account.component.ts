
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { map, Observable } from 'rxjs';
import { AppState } from 'src/app/shared/app.state';
import { getUser } from 'src/app/views/auth/state/auth.selector';
import { autologout } from 'src/app/views/auth/state/auth.action';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html'
})
export class CustomerAccountComponent implements OnInit {
  currentUserEmail$: Observable<string | undefined>;

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.currentUserEmail$ = this.store.select(getUser).pipe(
      map(user => user?.email)
    );
  }

   logout(): void {
    this.store.dispatch(autologout());
  }
}
