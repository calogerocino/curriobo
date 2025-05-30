import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BaseComponent } from './core/base/base.component';
import { AuthGuard } from './shared/guard/auth.guard';
import { ErrorPageComponent } from './views/error-page/error-page.component';
import { LandingpageComponent } from './views/landingpage/landingpage.component';
import { CurrioPreviewComponent } from './views/currio/currio-preview/currio-preview.component';
 import { CurrioIdCheckGuard } from './shared/guard/curriocheckid.guard';
const routes: Routes = [
  {
    path: '',
    component: LandingpageComponent,
    data: { title: 'Il tuo Curriò!' },
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./views/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'admin',
    data: { title: 'Admin' },
    component: BaseComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./views/dashboard/dashboard.module').then(
            (m) => m.DashboardModule
          ),
      },
      {
        path: 'utente',
        loadChildren: () =>
          import('./views/utente/utente.module').then((m) => m.UtenteModule),
      },
      {
        path: 'currio',
        loadChildren: () =>
          import('./views/currio/currio.module').then((m) => m.CurrioModule),
      },
      // {
      //   path: 'cliente',
      //   loadChildren: () =>
      //     import('./views/customer/customer.module').then(
      //       (m) => m.CustomerModule
      //     ),
      //   canActivate: [AuthGuard],
      //   data: { title: 'Area Cliente' },
      // },
    ],
  },
  {
    path: 'cliente',
    loadChildren: () =>
      import('./views/customer/customer.module').then((m) => m.CustomerModule),
    canActivate: [AuthGuard],
    data: { title: 'Area Cliente' },
  },
  {
    path: ':id',
    component: CurrioPreviewComponent,
    // canActivate: [CurrioIdCheckGuard],
    data: { title: 'Il mio Curriò - ' },
  },
  {
    path: 'error',
    component: ErrorPageComponent,
    data: {
      type: 404,
      title: 'Pagina non trovata',
      desc: 'Oopps!! La pagina che stai cercando non esiste.',
    },
  },
  {
    path: 'error/:type',
    component: ErrorPageComponent,
  },
  {
    path: 'cliente',
    loadChildren: () =>
      import('./views/customer/customer.module').then((m) => m.CustomerModule),
  },
  { path: '**', redirectTo: 'error', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
