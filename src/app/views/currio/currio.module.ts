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
import { SafeHtmlPipe } from 'src/app/shared/pipes/safe-html.pipe';

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
        component: CurrioEditComponent,
        data: { title: 'Gestisci Curriò' },
      },
    ],
  },
];

@NgModule({
  declarations: [
    CurrioComponent,
    ListaCurrioComponent,
    CurrioEditComponent,
    CurrioPreviewComponent,
    SafeHtmlPipe
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    NgbModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule.forChild(),
  ]
})
export class CurrioModule {}
