import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { FeahterIconModule } from 'src/app/shared/feather-icon/feather-icon.module';
import { NgbDropdownModule, NgbCollapseModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { CoreModule } from '../../core/core.module';

// Layout Cliente
import { CustomerLayoutComponent } from './customer-layout/customer-layout.component';
import { CustomerSidebarComponent } from './customer-layout/customer-sidebar/customer-sidebar.component';
import { CustomerNavbarComponent } from './customer-layout/customer-navbar/customer-navbar.component';
import { CustomerFooterComponent } from './customer-layout/customer-footer/customer-footer.component';

// Pagine specifiche
import { CustomerDashboardHomeComponent } from './dashboard-home/dashboard-home.component';
import { AccountInfoComponent } from './account-info/account-info.component';
import { CurrioEditComponent } from 'src/app/views/currio/currio-edit/currio-edit.component';
import { CurrioModule } from 'src/app/views/currio/currio.module';

const routes: Routes = [
  {
    path: '',
    component: CustomerLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        component: CustomerDashboardHomeComponent,
        data: { title: 'customer.dashboard.title' },
      },
      {
        path: 'account',
        component: AccountInfoComponent,
        data: { title: 'customer.account.title' },
      },
      {
        path: 'currio',
        component: CurrioEditComponent,
        data: { title: 'customer.currio.title' },
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
    AccountInfoComponent,
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
  ],
})
export class CustomerModule {}
