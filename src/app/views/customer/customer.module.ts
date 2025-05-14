// src/app/views/customer/customer.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { CustomerAccountComponent } from './account/account.component';

const routes: Routes = [
  {
    path: '', // Rotta base per /cliente
    redirectTo: 'account', // Reindirizza a /cliente/account
    pathMatch: 'full'
  },
  {
    path: 'account', // Mappa a /cliente/account
    component: CustomerAccountComponent,
    data: { title: 'Il Mio Account' }
    // Qui puoi aggiungere un AuthGuard specifico per clienti se necessario,
    // o se AuthGuard generale già verifica il tipo di utente/ruolo.
  }
  // Aggiungi altre rotte specifiche per l'area cliente qui
];

@NgModule({
  declarations: [
    CustomerAccountComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes) // Importa le rotte definite
  ]
})
export class CustomerModule { }
