import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { CurrioComponent } from './currio.component';
import { ListaCurrioComponent } from './listacurrio/listacurrio.component';
import { CurrioEditComponent } from './currio-edit/currio-edit.component';
import { CurrioPreviewComponent } from './currio-preview/currio-preview.component'; // << IMPORTA QUI

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { CurrioEffects } from './state/currio.effects';
import { CURRIO_STATE_NAME } from './state/currio.selector';
import { currioReducer } from './state/currio.reducer';

import { TranslateModule } from '@ngx-translate/core';

const routes: Routes = [
  {
    path: '', // Questo path è relativo a 'admin/currio' a causa del lazy loading
    component: CurrioComponent,
    children: [
      {
        path: '',
        redirectTo: 'listacurrio',
        pathMatch: 'full',
      },
      {
        path: 'listacurrio', // -> admin/currio/listacurrio
        component: ListaCurrioComponent,
        data: { title: 'Lista Curriò' },
      },
      {
        path: 'edit/:id', // -> admin/currio/edit/:id
        component: CurrioEditComponent,
        data: { title: 'Gestisci Curriò' },
      },
      {
        path: 'preview/:id', // -> admin/currio/preview/:id  << NUOVA ROTTA SPOSTATA QUI
        component: CurrioPreviewComponent,
        data: { title: 'Anteprima Curriò' }
      }
    ],
  },
];

@NgModule({
  declarations: [
    CurrioComponent,
    ListaCurrioComponent,
    CurrioEditComponent,
    CurrioPreviewComponent, // << DICHIARA QUI
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    NgbModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    StoreModule.forFeature(CURRIO_STATE_NAME, currioReducer),
    EffectsModule.forFeature([CurrioEffects]),
  ],
  providers: [
    // ... eventuali provider
  ],
})
export class CurrioModule {}
