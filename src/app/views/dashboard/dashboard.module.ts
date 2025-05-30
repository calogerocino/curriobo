import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { FeahterIconModule } from 'src/app/shared/feather-icon/feather-icon.module';
import {
  NgbDropdownModule,
  NgbDatepickerModule,
} from '@ng-bootstrap/ng-bootstrap';

import { DashboardHomeComponent } from './dashboard.component';
import { TranslateModule } from '@ngx-translate/core';

const routes: Routes = [
  {
    path: '',
    component: DashboardHomeComponent,
    data: { title: 'Dashboard' },
  },
];

@NgModule({
  declarations: [DashboardHomeComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    FeahterIconModule,
    NgbDropdownModule,
    NgbDatepickerModule,
    TranslateModule,
  ],
})
export class DashboardModule {}
