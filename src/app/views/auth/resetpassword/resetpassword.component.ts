import { Component } from '@angular/core';
import { AuthService } from "../../../shared/servizi/auth.service";

@Component({
  selector: 'app-resetpassword',
  templateUrl: './resetpassword.component.html'
})
export class ResetpasswordComponent {
constructor(private readonly authService: AuthService) {}

forgotPassword(newPassword: string) {
  this.authService.ForgotPassword(newPassword);
}
}
