import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute, Event as RouterEvent } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { filter, map, take } from 'rxjs/operators';
import { AppState } from './shared/app.state';
import { getLoading } from './shared/store/shared.selectors';
import { isAuthenticated } from './views/auth/state/auth.selector';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  showLoading$: Observable<boolean> = this.store.select(getLoading);
  title = 'CurriòDashboard';
  private lastUrlKey = 'lastAuthenticatedUrl';

  constructor(
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
    private readonly titleService: Title,
    private readonly translate: TranslateService,
    private readonly store: Store<AppState>
  ) {
    this.translate.setDefaultLang('it');
  }

  ngOnInit(): void {
    this.router.events
      .pipe(filter((event: RouterEvent): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        let rt = this.getChild(this.activatedRoute);

        rt.data.subscribe((data: { title: string }) => {
          this.titleService.setTitle(data.title + ' ');
        });

        this.store.select(isAuthenticated).pipe(take(1)).subscribe(isAuth => {
          if (isAuth) {
            const urlToSave = event.urlAfterRedirects;
            if (urlToSave && (urlToSave.startsWith('/admin/') || urlToSave.startsWith('/cliente/')) && !urlToSave.includes('/auth')) {
              localStorage.setItem(this.lastUrlKey, urlToSave);
            }
          }
        });
      });
  }

  getChild(activatedRoute: ActivatedRoute) {
    if (activatedRoute.firstChild) {
      return this.getChild(activatedRoute.firstChild);
    } else {
      return activatedRoute;
    }
  }
}
