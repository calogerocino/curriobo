import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Routes, RouterModule } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { EffectsModule } from "@ngrx/effects";

import { AuthComponent } from "./auth.component";
import { RegisterComponent } from "./register/register.component";
import { ResetpasswordComponent } from './resetpassword/resetpassword.component';
import { VerifyemailComponent } from './verifyemail/verifyemail.component';
import { CompletaRegistrazioneComponent } from './completa-registrazione/completa-registrazione.component';
import { LoginComponent } from "./login/login.component"; 
import { AuthEffects } from "./state/auth.effects";

const routes: Routes = [
  {
    path: "",
    component: AuthComponent,
       children: [
      { path: "", redirectTo: "login", pathMatch: "full" },
      { path: "login", component: LoginComponent, data: { title: "Login Amministrazione" } },
      { path: "register", component: RegisterComponent, data: { title: "Registrazione" } },
      { path: "resetpassword", component: ResetpasswordComponent, data: { title: "Reset Password" } },
      { path: "verifyemail", component: VerifyemailComponent, data: { title: "Verifica Email" } },
      { path: "completa-registrazione", component: CompletaRegistrazioneComponent, data: { title: "Completa Registrazione" }},
    ],
  },
];

@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    AuthComponent,
    ResetpasswordComponent,
    VerifyemailComponent,
    CompletaRegistrazioneComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    EffectsModule.forFeature([AuthEffects]),
  ],
})
export class AuthModule {}
