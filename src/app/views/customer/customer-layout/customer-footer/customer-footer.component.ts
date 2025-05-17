import { Component } from '@angular/core';

@Component({
  selector: 'app-customer-footer',
  templateUrl: './customer-footer.component.html',
})
export class CustomerFooterComponent {
  constructor() {}

  getYear() {
    return new Date().getFullYear();
  }
}
