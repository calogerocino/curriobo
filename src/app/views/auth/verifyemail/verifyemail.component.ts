import { Component } from '@angular/core';
import { User } from 'src/app/shared/models/user.interface';
import { AuthService } from '../../../shared/servizi/auth.service';

@Component({
  selector: 'app-verifyemail',
  templateUrl: './verifyemail.component.html'
})
export class VerifyemailComponent {
  user: any;

  constructor(private readonly authService: AuthService) {}

  sendVerificationMail() {
    // this.authService.SendVerificationMail();
  }
}
