import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Renderer2,
  Inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

import MetisMenu from 'metismenujs';

import { MENU } from './menu';
import { MenuItem } from './menu.model';
import { Router, NavigationEnd } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent implements OnInit, AfterViewInit {
  @ViewChild('sidebarToggler') sidebarToggler: ElementRef;

  menuItems = [];
  @ViewChild('sidebarMenu') sidebarMenu: ElementRef;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private readonly router: Router,
    private readonly translate: TranslateService
  ) {
    this.router.events.forEach((event) => {
      if (event instanceof NavigationEnd) {
        this._activateMenuDropdown();
        if (window.matchMedia('(max-width: 991px)').matches) {
          this.document.body.classList.remove('sidebar-open');
        }
      }
    });
  }

  ngOnInit(): void {
    this.menuItems = MENU;
  }

  ngAfterViewInit() {
    new MetisMenu(this.sidebarMenu.nativeElement);
    this._activateMenuDropdown();
    const desktopMedium = window.matchMedia(
      '(min-width:992px) and (max-width: 1199px)'
    );
    desktopMedium.addListener(this.iconSidebar);
    this.iconSidebar(desktopMedium);
  }

  toggleSidebar(event: Event) {
    this.sidebarToggler.nativeElement.classList.toggle('active');
    this.sidebarToggler.nativeElement.classList.toggle('not-active');
    if (window.matchMedia('(min-width: 992px)').matches) {
      event.preventDefault();
      this.document.body.classList.toggle('sidebar-folded');
    } else if (window.matchMedia('(max-width: 991px)').matches) {
      event.preventDefault();
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

  iconSidebar(e) {
    if (e.matches) {
      this.document.body.classList.add('sidebar-folded');
    } else {
      this.document.body.classList.remove('sidebar-folded');
    }
  }


  hasItems(item: MenuItem) {
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
        }

        const parent3El = parent2El.parentElement;
        if (parent3El) {
          parent3El.classList.remove('mm-active');

          if (parent3El.classList.contains('side-nav-item')) {
            const firstAnchor = parent3El.querySelector('.side-nav-link-a-ref');

            if (firstAnchor) {
              firstAnchor.classList.remove('mm-active');
            }
          }

          const parent4El = parent3El.parentElement;
          if (parent4El) {
            parent4El.classList.remove('mm-show');

            const parent5El = parent4El.parentElement;
            if (parent5El) {
              parent5El.classList.remove('mm-active');
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
      if (window.location.pathname === links[i]['pathname']) {
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

        const parent3El = parent2El.parentElement;
        if (parent3El) {
          parent3El.classList.add('mm-active');

          if (parent3El.classList.contains('side-nav-item')) {
            const firstAnchor = parent3El.querySelector('.side-nav-link-a-ref');

            if (firstAnchor) {
              firstAnchor.classList.add('mm-active');
            }
          }

          const parent4El = parent3El.parentElement;
          if (parent4El) {
            parent4El.classList.add('mm-show');

            const parent5El = parent4El.parentElement;
            if (parent5El) {
              parent5El.classList.add('mm-active');
            }
          }
        }
      }
    }
  }
}
