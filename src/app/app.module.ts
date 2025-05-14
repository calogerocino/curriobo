import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  HttpClientModule,
} from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';

import { CoreModule } from './core/core.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

//AUTH
import { AuthGuard } from './shared/guard/auth.guard';
import { AuthService } from './shared/servizi/auth.service';

import { AppComponent } from './app.component';
import { ErrorPageComponent } from './views/error-page/error-page.component';

import { HIGHLIGHT_OPTIONS } from 'ngx-highlightjs';

//NGRX
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

//FIREBASE
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { environment } from '../environments/environment';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideDatabase, getDatabase } from '@angular/fire/database';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { FIREBASE_OPTIONS } from '@angular/fire/compat';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { appReducer } from './shared/app.state';
import { AuthTokenInterceptor } from './shared/servizi/AuthToken.interceptor';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { LandingpageComponent } from './views/landingpage/landingpage.component';
import { CURRIO_STATE_NAME } from './views/currio/state/currio.selector';
import { currioReducer } from './views/currio/state/currio.reducer';
import { CurrioEffects } from './views/currio/state/currio.effects';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

@NgModule({
  declarations: [AppComponent, ErrorPageComponent, LandingpageComponent],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    FormsModule,
    CoreModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    BrowserAnimationsModule,
    NgbModule,
    EffectsModule.forRoot([]),
    StoreModule.forRoot(appReducer),
    StoreModule.forFeature(CURRIO_STATE_NAME, currioReducer),
    EffectsModule.forFeature([CurrioEffects]),
    StoreDevtoolsModule.instrument({
      logOnly: false,
      connectInZone: true,
    }),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideDatabase(() => getDatabase()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage())
  ],
  providers: [
    AuthService,
    { provide: FIREBASE_OPTIONS, useValue: environment.firebase },
    AuthGuard,
    {
      provide: HIGHLIGHT_OPTIONS,
      useValue: {
        coreLibraryLoader: () => import('highlight.js/lib/core'),
        languages: {
          xml: () => import('highlight.js/lib/languages/xml'),
          typescript: () => import('highlight.js/lib/languages/typescript'),
          scss: () => import('highlight.js/lib/languages/scss'),
        },
      },
    },
    { provide: HTTP_INTERCEPTORS, useClass: AuthTokenInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
