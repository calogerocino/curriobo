import { Directive, AfterViewInit } from '@angular/core';
 import * as feather from 'feather-icons';

@Directive({
  selector: '[appFeatherIcon]'
})
export class FeatherIconDirective implements AfterViewInit {
  ngAfterViewInit() {
     //feather icon
     feather.replace();
  }
}
