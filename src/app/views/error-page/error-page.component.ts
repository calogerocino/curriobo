import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-error-page',
  templateUrl: './error-page.component.html',
  styleUrls: ['./error-page.component.scss']
})
export class ErrorPageComponent implements OnInit, OnDestroy {

  type: any;
  title: any;
  desc: any;
  private sub: Subscription;

  constructor(private readonly route: ActivatedRoute) { }

  ngOnInit(): void {
    this.type = this.route.snapshot.paramMap.get('type');
    console.log(this.type);

    this.sub = this.route.data.subscribe( param => {
      if(param['type']) {
        this.type = param['type'];
      }
      if(param['title']) {
        this.title = param['title'];
      }
      if(param['desc']) {
        this.desc = param['desc']
      }
    });

    switch(this.type) {
      case '404':
        if (!this.title) {
          this.title = 'Pagina non trovata'
        }
        if (!this.desc) {
          this.desc = 'Oopps!! La pagina che stai cercando non esiste.'
        }
        break;
      case '500':
        if (!this.title) {
          this.title = 'Errore server interno'
        }
        if (!this.desc) {
          this.desc = 'Oopps!! C\'e stato un errore imprevisto. Perfavore, riprova più tardi.'
        }
        break;
      default:
        // if (!this.type) {
          this.type = 'Ooops..';
        // }
        if (!this.title) {
          this.title = 'Qualcosa è andato storto';
        }
        if (!this.desc) {
          this.desc = 'Sembra che qualcosa sia andato storto.<br>' + 'Ci stiamo lavorando';
        }
    }
  }

	ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

}

