import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // Assicurati che ReactiveFormsModule sia importato

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
// ... altri import ...

import { CurrioComponent } from './currio.component';
import { ListaCurrioComponent } from './listacurrio/listacurrio.component';
import { CurrioEditComponent } from './currio-edit/currio-edit.component';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
// Rinomina Effects e State Name
import { CurrioEffects } from './state/currio.effects';
import { CURRIO_STATE_NAME } from './state/currio.selector';
import { currioReducer } from './state/currio.reducer';

import { TranslateModule } from '@ngx-translate/core';

const routes: Routes = [
  {
    path: '',
    component: CurrioComponent,
    children: [
      {
        path: '',
        redirectTo: 'listacurrio',
        pathMatch: 'full',
      },
      {
        path: 'listacurrio',
        component: ListaCurrioComponent,
        data: { title: 'Lista Curriò' },
      },
      {
        path: 'edit/:id', // Gestisce sia modifica ('some-id') che creazione ('new')
        component: CurrioEditComponent,
        data: { title: 'Gestisci Curriò' }, // Titolo generico
      },
    ],
  },
];

@NgModule({
  declarations: [
    CurrioComponent,
    ListaCurrioComponent,
    CurrioEditComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    NgbModule,
    FormsModule,
    ReactiveFormsModule, // Aggiunto ReactiveFormsModule
    // ... altri moduli come TagInputModule, NgSelectModule, DropzoneModule
    TranslateModule,
    StoreModule.forFeature(CURRIO_STATE_NAME, currioReducer), // Usa il nome e reducer corretti
    EffectsModule.forFeature([CurrioEffects]), // Usa Effects corretti
  ],
  providers: [
    // ... eventuali provider
  ],
})
export class CatalogoModule {} // Rinomina in CurrioModule se preferisci
