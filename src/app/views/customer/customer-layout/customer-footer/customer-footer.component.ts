import { Component } from '@angular/core';

@Component({
  selector: 'app-customer-footer',
  templateUrl: './customer-footer.component.html',
  styleUrls: ['./customer-footer.component.scss'] // Puoi usare src/app/core/footer/footer.component.scss
})
export class CustomerFooterComponent {
  constructor() {}

  getYear() {
    return new Date().getFullYear();
  }
}
