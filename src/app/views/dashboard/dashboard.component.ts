import { Component, OnInit } from '@angular/core';

import { NgbDateStruct, NgbCalendar } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  preserveWhitespaces: true,
})
export class DashboardComponent implements OnInit {
  /**
   * NgbDatepicker
   */
  currentDate: NgbDateStruct;

  constructor(private readonly calendar: NgbCalendar) {}

  ngOnInit(): void {
    this.currentDate = this.calendar.getToday();
  }
}
