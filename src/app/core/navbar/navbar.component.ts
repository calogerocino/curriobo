import { Component, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { AuthService } from '../../shared/servizi/auth.service';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/shared/app.state';
import { getUser } from 'src/app/views/auth/state/auth.selector';
import { User } from 'src/app/shared/models/user.interface';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  connectedUser$: Observable<User> = this.store.select(getUser);
  constructor(
    @Inject(DOCUMENT) private document: Document,
    private readonly authService: AuthService,
    private readonly store: Store<AppState>,
    private readonly translate: TranslateService
  ) {}

  toggleSidebar(e: Event) {
    e.preventDefault();
    this.document.body.classList.toggle('sidebar-open');
  }

  signOut(event: Event) {
    this.authService.SignOut(event);
  }

  switchLanguage(event: EventTarget) {
    let id = (event as Element).id;
    this.translate.use(id);
  }
  currentLang() {
    return this.translate.currentLang;
  }
}
