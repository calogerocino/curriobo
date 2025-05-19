import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { CurrioComponent } from './currio.component';
import { ListaCurrioComponent } from './listacurrio/listacurrio.component';
import { CurrioEditComponent } from './currio-edit/currio-edit.component';
import { CurrioPreviewComponent } from './currio-preview/currio-preview.component';

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
        path: 'edit/:id',
        component: CurrioEditComponent, // Questo è il componente unificato
        data: { title: 'Gestisci Curriò' },
      },
       // La rotta per l'anteprima del singolo Curriò è gestita a livello di AppRoutingModule o dove definita per /:id
    ],
  },
];

@NgModule({
  declarations: [
    CurrioComponent,
    ListaCurrioComponent,
    CurrioEditComponent, // Già dichiarato qui
    CurrioPreviewComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    NgbModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  exports: [ // Esporta il componente se vuoi importarlo direttamente in altri moduli senza importare l'intero CurrioModule
    // CurrioEditComponent
  ]
})
export class CurrioModule {}
