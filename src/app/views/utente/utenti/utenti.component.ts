import { Component } from '@angular/core';
import { AuthService } from 'src/app/shared/servizi/auth.service';
import { UserService } from 'src/app/shared/servizi/user.service';

@Component({
  selector: 'app-utenti',
  templateUrl: './utenti.component.html',
  styleUrls: ['./utenti.component.scss'],
})
export class UtentiComponent {
  fflist: any;

  constructor(
    private readonly userService: UserService,
    public readonly authService: AuthService
  ) {
    this.userService.getFFList().subscribe((data) => {
      this.fflist = data.map((e) => {
        return {
          id: e.payload.doc.id,
          ffdata: e.payload.doc.data(),
        };
      });
    });
  }
}
