import { Component, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from 'src/app/shared/app.state';
import { getUser } from 'src/app/views/auth/state/auth.selector';
import { User } from 'src/app/shared/models/user.interface';
import { TranslateService } from '@ngx-translate/core';
import { autologout } from 'src/app/views/auth/state/auth.action'; // Per il logout

@Component({
  selector: 'app-customer-navbar',
  templateUrl: './customer-navbar.component.html',
  styleUrls: ['./customer-navbar.component.scss'] // Puoi usare src/app/core/navbar/navbar.component.scss
})
export class CustomerNavbarComponent implements OnInit {
  connectedUser$: Observable<User | null>; // Modificato per accettare null

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private store: Store<AppState>, // Rimosso readonly per dispatch
    public translate: TranslateService // Reso public per il template
  ) {}

  ngOnInit(): void {
    this.connectedUser$ = this.store.select(getUser);
  }

  toggleSidebar(e: Event) {
    e.preventDefault();
    this.document.body.classList.toggle('sidebar-open');
  }

  signOut(event: Event) {
    event.preventDefault();
    this.store.dispatch(autologout());
  }

  switchLanguage(event: EventTarget | null) { // Accetta null
    if (event) {
      const langId = (event as Element).id;
      if (langId) {
        this.translate.use(langId);
      }
    }
  }

  currentLang(): string {
    return this.translate.currentLang || this.translate.defaultLang;
  }
}
