import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import MetisMenu from 'metismenujs';
import { Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CUSTOMER_MENU } from 'src/app/core/sidebar/customer-menu';
import { MenuItem } from 'src/app/core/sidebar/menu.model';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-customer-sidebar',
  templateUrl: './customer-sidebar.component.html',
})
export class CustomerSidebarComponent implements OnInit, AfterViewInit {
  @ViewChild('sidebarToggler') sidebarToggler!: ElementRef;
  menuItems: MenuItem[] = [];
  @ViewChild('sidebarMenu') sidebarMenu!: ElementRef;
  private routerEventsSubscription: Subscription;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private router: Router,
    public translate: TranslateService // Reso public per il template
  ) {
    this.routerEventsSubscription = this.router.events.pipe(
      filter((event: RouterEvent): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this._activateMenuDropdown();
      if (window.matchMedia('(max-width: 991px)').matches) {
        this.document.body.classList.remove('sidebar-open');
      }
    });
  }

  ngOnInit(): void {
    this.menuItems = CUSTOMER_MENU; // Usa il menu specifico per il cliente
    // Inizializzazione di feather icons non necessaria se usi FeahterIconModule/Directive
  }

  ngAfterViewInit() {
    if (this.sidebarMenu && this.sidebarMenu.nativeElement) {
        new MetisMenu(this.sidebarMenu.nativeElement);
        this._activateMenuDropdown();
    }

    // Logica per sidebar-folded (se la vuoi mantenere, adattare o rimuovere)
    const desktopMedium = window.matchMedia('(min-width:992px) and (max-width: 1199px)');
    // desktopMedium.addEventListener('change', this.iconSidebar.bind(this)); // Usa addEventListener
    // this.iconSidebar(desktopMedium);
  }

  ngOnDestroy() {
    if (this.routerEventsSubscription) {
      this.routerEventsSubscription.unsubscribe();
    }
    // Rimuovi listener se aggiunto con addEventListener
  }

  toggleSidebar(event: Event) {
    event.preventDefault();
    if (this.sidebarToggler && this.sidebarToggler.nativeElement) {
        this.sidebarToggler.nativeElement.classList.toggle('active');
        this.sidebarToggler.nativeElement.classList.toggle('not-active');
    }

    if (window.matchMedia('(min-width: 992px)').matches) {
      this.document.body.classList.toggle('sidebar-folded');
    } else if (window.matchMedia('(max-width: 991px)').matches) {
      this.document.body.classList.toggle('sidebar-open');
    }
  }

  operSidebarFolded() {
    if (this.document.body.classList.contains('sidebar-folded')) {
      this.document.body.classList.add('open-sidebar-folded');
    }
  }

  closeSidebarFolded() {
    if (this.document.body.classList.contains('sidebar-folded')) {
      this.document.body.classList.remove('open-sidebar-folded');
    }
  }

  // iconSidebar(e: MediaQueryList | MediaQueryListEvent) {
  //   const MQL = e instanceof MediaQueryListEvent ? e.target as MediaQueryList : e;
  //   if (MQL.matches) {
  //     this.document.body.classList.add('sidebar-folded');
  //   } else {
  //     this.document.body.classList.remove('sidebar-folded');
  //   }
  // }

  hasItems(item: MenuItem): boolean {
    return item.subItems !== undefined ? item.subItems.length > 0 : false;
  }

  _activateMenuDropdown() {
    this.resetMenuItems();
    this.activateMenuItems();
  }

  resetMenuItems() {
    const links = document.getElementsByClassName('nav-link-ref');
    for (let i = 0; i < links.length; i++) {
      const menuItemEl = links[i];
      menuItemEl.classList.remove('mm-active');
      const parentEl = menuItemEl.parentElement;
      if (parentEl) {
        parentEl.classList.remove('mm-active');
        const parent2El = parentEl.parentElement;
        if (parent2El) {
          parent2El.classList.remove('mm-show');
          const parent3El = parent2El.parentElement;
          if (parent3El) {
            parent3El.classList.remove('mm-active');
            if (parent3El.classList.contains('side-nav-item')) {
              const firstAnchor = parent3El.querySelector('.side-nav-link-a-ref');
              if (firstAnchor) firstAnchor.classList.remove('mm-active');
            }
            const parent4El = parent3El.parentElement;
            if (parent4El) {
              parent4El.classList.remove('mm-show');
              const parent5El = parent4El.parentElement;
              if (parent5El) parent5El.classList.remove('mm-active');
            }
          }
        }
      }
    }
  }

  activateMenuItems() {
    const links = document.getElementsByClassName('nav-link-ref');
    let menuItemEl = null;
    for (let i = 0; i < links.length; i++) {
      if (window.location.pathname === (links[i] as HTMLAnchorElement).pathname) {
        menuItemEl = links[i];
        break;
      }
    }

    if (menuItemEl) {
      menuItemEl.classList.add('mm-active');
      const parentEl = menuItemEl.parentElement;
      if (parentEl) {
        parentEl.classList.add('mm-active');
        const parent2El = parentEl.parentElement;
        if (parent2El) {
          parent2El.classList.add('mm-show');
        }
        const parent3El = parent2El?.parentElement;
        if (parent3El) {
          parent3El.classList.add('mm-active');
          if (parent3El.classList.contains('side-nav-item')) {
            const firstAnchor = parent3El.querySelector('.side-nav-link-a-ref');
            if (firstAnchor) firstAnchor.classList.add('mm-active');
          }
          const parent4El = parent3El.parentElement;
          if (parent4El) {
            parent4El.classList.add('mm-show');
            const parent5El = parent4El.parentElement;
            if (parent5El) parent5El.classList.add('mm-active');
          }
        }
      }
    }
  }
}
