import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { UtenteComponent } from './utente.component';
import { UtentiComponent } from './utenti/utenti.component';
import { ProfiloComponent } from './profilo/profilo.component';
import { TranslateModule } from '@ngx-translate/core';

const routes: Routes = [
  {
    path: '',
    component: UtenteComponent,
    children: [
      {
        path: '',
        redirectTo: 'utente',
        pathMatch: 'full',
      },
      {
        path: 'utenti',
        component: UtentiComponent,
        data: { title: 'Gestisci utenti' },
      },
      {
        path: 'profilo/:id',
        component: ProfiloComponent,
        data: { title: 'Profilo' },
      },
    ],
  },
];

@NgModule({
  declarations: [UtenteComponent, UtentiComponent, ProfiloComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class UtenteModule {}
