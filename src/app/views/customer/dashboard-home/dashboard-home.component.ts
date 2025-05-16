import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppState } from 'src/app/shared/app.state';
import { User } from 'src/app/shared/models/user.interface';
import { getUser } from 'src/app/views/auth/state/auth.selector';

@Component({
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.scss'] // Opzionale
})
export class CustomerDashboardHomeComponent implements OnInit {
  currentUser$: Observable<User | null>;
  userName$: Observable<string | undefined>;

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.currentUser$ = this.store.select(getUser);
    this.userName$ = this.currentUser$.pipe(
      map(user => user?.displayName || user?.email?.split('@')[0])
    );
  }
}
