import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { FeahterIconModule } from 'src/app/shared/feather-icon/feather-icon.module';
import { NgbDropdownModule, NgbCollapseModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { CoreModule } from '../../core/core.module';

import { CustomerLayoutComponent } from './customer-layout/customer-layout.component';
import { CustomerSidebarComponent } from './customer-layout/customer-sidebar/customer-sidebar.component';
import { CustomerNavbarComponent } from './customer-layout/customer-navbar/customer-navbar.component';
import { CustomerFooterComponent } from './customer-layout/customer-footer/customer-footer.component';

import { CustomerDashboardHomeComponent } from './dashboard-home/dashboard-home.component';
import { CurrioEditComponent } from 'src/app/views/currio/currio-edit/currio-edit.component';
import { CurrioModule } from 'src/app/views/currio/currio.module';

import { ProfiloComponent } from 'src/app/views/utente/profilo/profilo.component';
import { UtenteModule } from 'src/app/views/utente/utente.module';


const routes: Routes = [
  {
    path: '',
    component: CustomerLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        component: CustomerDashboardHomeComponent,
        data: { title: 'customer.dashboard.welcome' },
      },
      {
        path: 'account',
        component: ProfiloComponent,
        data: { title: 'customer.menu.profile' },
      },
      {
        path: 'currio',
        component: CurrioEditComponent,
        data: { title: 'customer.menu.currio' },
      },
    ],
  },
];

@NgModule({
  declarations: [
    CustomerLayoutComponent,
    CustomerSidebarComponent,
    CustomerNavbarComponent,
    CustomerFooterComponent,
    CustomerDashboardHomeComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    TranslateModule.forChild(),
    FeahterIconModule,
    NgbDropdownModule,
    NgbCollapseModule,
    NgbTooltipModule,
    CoreModule,
    CurrioModule,
    UtenteModule,
  ],
})
export class CustomerModule {}
