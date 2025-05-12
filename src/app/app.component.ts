import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { filter, map } from 'rxjs/operators';
import { AppState } from './shared/app.state';
import { Observable } from 'rxjs';
import { getLoading } from './shared/store/shared.selectors';

// import { AuthService } from "./shared/guard/auth.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  showLoading$: Observable<boolean> = this.store.select(getLoading);
  title = 'pixel-angular';

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
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        var rt = this.getChild(this.activatedRoute);

        rt.data.subscribe((data: { title: string }) => {
          this.titleService.setTitle(data.title + ' ');
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
