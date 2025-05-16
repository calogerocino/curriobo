import { Component, Renderer2, OnInit, OnDestroy } from '@angular/core';
import { Router, RouteConfigLoadStart, RouteConfigLoadEnd, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-customer-layout',
  templateUrl: './customer-layout.component.html',
  styleUrls: ['./customer-layout.component.scss'] // Potresti creare o riusare base.component.scss
})
export class CustomerLayoutComponent implements OnInit, OnDestroy {
  isLoading: boolean;
  private routerSubscription: Subscription;

  constructor(private router: Router, private renderer: Renderer2) {
    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof RouteConfigLoadStart) {
        this.isLoading = true;
      } else if (event instanceof RouteConfigLoadEnd) {
        this.isLoading = false;
      }
    });
  }

  ngOnInit(): void {
    // Aggiungi/rimuovi classi dal body se necessario per lo stile specifico del cliente
    this.renderer.addClass(document.body, 'sidebar-dark'); // Esempio, se vuoi lo stesso tema sidebar admin

    // Per gestire la chiusura della sidebar su navigazione in mobile (come in BaseComponent)
    this.routerSubscription.add(
      this.router.events.pipe(
        filter((event: RouterEvent): event is NavigationEnd => event instanceof NavigationEnd)
      ).subscribe(() => {
        if (window.matchMedia('(max-width: 991px)').matches) {
          this.renderer.removeClass(document.body, 'sidebar-open');
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'sidebar-dark'); // Pulisci la classe
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
