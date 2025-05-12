import { Component } from "@angular/core";
import { AuthService } from "../../../shared/servizi/auth.service";

@Component({
  selector: "app-register",
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.scss"],
})
export class RegisterComponent {
  constructor(private readonly authService: AuthService) {}

  signUp(email: string, password: string) {
    this.authService.SignUp(email, password);
  }

  googleAuth() {
    this.authService.GoogleAuth();
  }
}
