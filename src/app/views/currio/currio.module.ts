import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TagInputModule } from 'ngx-chips';
import { NgSelectModule } from '@ng-select/ng-select';

// Ngx-dropzone-wrapper
import { DropzoneModule } from 'ngx-dropzone-wrapper';
import { DROPZONE_CONFIG } from 'ngx-dropzone-wrapper';
import { DropzoneConfigInterface } from 'ngx-dropzone-wrapper';
const DEFAULT_DROPZONE_CONFIG: DropzoneConfigInterface = {
  url: 'https://httpbin.org/post',
  maxFilesize: 50,
  acceptedFiles: 'image/*',
};

import { CurrioComponent } from './currio.component';
import { ListaCurrioComponent } from './listacurrio/listacurrio.component';
import { CurrioEditComponent } from './currio-edit/currio-edit.component';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { CatalogoEffects } from './state/currio.effects';
import { PRODUCT_STATE_NAME } from './state/currio.selector';
import { productsReducer } from './state/currio.reducer';

import { TranslateModule } from '@ngx-translate/core';
const routes: Routes = [
  {
    path: '',
    component: CurrioComponent,
    children: [
      {
        path: '',
        redirectTo: 'currio',
        pathMatch: 'full',
      },
      {
        path: 'listacurrio',
        component: ListaCurrioComponent,
        data: { title: 'Currio' },
      },
      {
        path: 'edit/:id',
        component: CurrioEditComponent,
        data: { title: 'Modifica currio' },
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
    ReactiveFormsModule,
    TagInputModule,
    NgSelectModule,
    DropzoneModule,
    TranslateModule,
    StoreModule.forFeature(PRODUCT_STATE_NAME, productsReducer),
    EffectsModule.forFeature([CatalogoEffects]),
  ],
  providers: [
    {
      provide: DROPZONE_CONFIG,
      useValue: DEFAULT_DROPZONE_CONFIG,
    },
  ],
})
export class CatalogoModule {}
