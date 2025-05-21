import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { AuthService } from '../../shared/servizi/auth.service';
import { Observable, Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/shared/app.state';
import { getUser } from 'src/app/views/auth/state/auth.selector';
import { User } from 'src/app/shared/models/user.interface';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Currio } from 'src/app/shared/models/currio.model';
import { getCurrios } from 'src/app/views/currio/state/currio.selector';
import { loadCurrios } from 'src/app/views/currio/state/currio.action';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit, OnDestroy {
  connectedUser$: Observable<User | null>;
  nuoveRichiesteCurrio$: Observable<Currio[]>;
  conteggioNuoveRichieste$: Observable<number>;
  ciSonoNuoveRichieste$: Observable<boolean>;

  private subscriptions = new Subscription();

  constructor(
    @Inject(DOCUMENT) private document: Document,
    public readonly authService: AuthService,
    private readonly store: Store<AppState>,
    private readonly translate: TranslateService,
    readonly router: Router
  ) {}

  ngOnInit(): void {
    this.connectedUser$ = this.store.select(getUser);

    this.store.dispatch(loadCurrios());

    const allCurrios$ = this.store.select(getCurrios);

    this.nuoveRichiesteCurrio$ = allCurrios$.pipe(
      map((currios) => currios.filter((c) => c.status === 'nuova_richiesta'))
    );

    this.conteggioNuoveRichieste$ = this.nuoveRichiesteCurrio$.pipe(
      map((richieste) => richieste.length)
    );

    this.ciSonoNuoveRichieste$ = this.conteggioNuoveRichieste$.pipe(
      map((count) => count > 0)
    );
  }

  toggleSidebar(e: Event): void {
    e.preventDefault();
    this.document.body.classList.toggle('sidebar-open');
  }

  signOut(event: Event): void {
    this.authService.SignOut(event);
  }

  switchLanguage(event: EventTarget | null): void {
    if (event) {
      const element = event as Element;
      const langId = element.id;
      if (langId) {
        this.translate.use(langId);
      }
    }
  }

  currentLang(): string {
    return this.translate.currentLang || this.translate.defaultLang;
  }

  apriRichiestaCurrio(currioId: string | undefined): void {
    if (currioId) {
      this.router.navigate(['/admin/currio/edit', currioId]);
      const notificationDropdown = document.getElementById(
        'notificationDropdown'
      );
      if (
        notificationDropdown &&
        notificationDropdown.parentElement?.classList.contains('show')
      ) {
        notificationDropdown.click();
      }
    }
  }

  visualizzaTutteLeRichieste(): void {
    this.router.navigate(['/admin/currio/listacurrio'], {
      queryParams: { statusFilter: 'nuova_richiesta' },
    });
    const notificationDropdown = document.getElementById(
      'notificationDropdown'
    );
    if (
      notificationDropdown &&
      notificationDropdown.parentElement?.classList.contains('show')
    ) {
      notificationDropdown.click();
    }
  }

  eliminaTutteLeNotifiche(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    console.log(
      'Elimina tutte le notifiche cliccato - implementare logica se necessario.'
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
