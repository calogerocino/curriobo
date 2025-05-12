import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LoginComponent } from "./login/login.component";
import { RegisterComponent } from "./register/register.component";
import { ResetpasswordComponent } from './resetpassword/resetpassword.component';
import { Routes, RouterModule } from "@angular/router";
import { AuthComponent } from "./auth.component";

import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { VerifyemailComponent } from './verifyemail/verifyemail.component';
import { EffectsModule } from "@ngrx/effects";
import { AuthEffects } from "./state/auth.effects";

const routes: Routes = [
  {
    path: "",
    component: AuthComponent,
    children: [
      {
        path: "",
        redirectTo: "login",
        pathMatch: "full",
      },
      {
        path: "login",
        component: LoginComponent,
        data: { title: "Login" },
      },
      {
        path: "register",
        component: RegisterComponent,
        data: { title: "Registrazione" },
      },
      {
        path: "resetpassword",
        component: ResetpasswordComponent,
        data: { title: "Reset Password" },
      },
      {
        path: "verifyemail",
        component: VerifyemailComponent,
        data: { title: "Verifica mail" },
      },
    ],
  },
];

@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    AuthComponent,
    ResetpasswordComponent,
    VerifyemailComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    EffectsModule.forFeature([AuthEffects]),
    ReactiveFormsModule,
  ],
})
export class AuthModule {}
