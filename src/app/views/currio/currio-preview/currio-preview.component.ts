import { Component, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { AppState } from 'src/app/shared/app.state';
import { Currio, CurrioEsperienza } from 'src/app/shared/models/currio.model';
import { User } from 'src/app/shared/models/user.interface';
import { AuthService } from 'src/app/shared/servizi/auth.service';
import { getUser, isUserAdmin } from '../../auth/state/auth.selector';
import { loadCurrioById } from '../state/currio.action';
import { getCurrioById } from '../state/currio.selector';

@Component({
  selector: 'app-currio-preview',
  templateUrl: './currio-preview.component.html',
  styleUrls: ['./currio-preview.component.scss']
})
export class CurrioPreviewComponent implements OnInit, OnDestroy {
  currio: Currio | null = null;
  isLoading = true;
  private currioSubscription: Subscription | undefined;
  private userSubscription: Subscription | undefined;
  isUserAdmin$: Observable<boolean>;
  currentYear = new Date().getFullYear();
  isMobileMenuOpen = false;
  private projectColorSchemes: { [key: number]: string } = {};

  isPrivateForViewer = false;

  constructor(
    private route: ActivatedRoute,
    private store: Store<AppState>,
    public translate: TranslateService,
    private el: ElementRef,
    private authService: AuthService,
    private router: Router
  ) {
    this.isUserAdmin$ = this.store.select(isUserAdmin);
  }

  ngOnInit(): void {
    const currioId = this.route.snapshot.paramMap.get('id');
    if (currioId) {
      this.store.dispatch(loadCurrioById({ id: currioId }));

      this.currioSubscription = this.store.select(getCurrioById, { id: currioId }).pipe(
        filter(currio => !!currio)
      ).subscribe(currioData => {
        this.currio = currioData;
        
        this.userSubscription = this.store.select(getUser).subscribe(user => {
            this.checkPrivacy(user);
        });
        
        this.setLanguage(this.currio?.linguaDefault || 'it');
        this.isLoading = false;
      });

    } else {
      this.isLoading = false;
    }
  }

  checkPrivacy(user: User | null): void {
      if (!this.currio) return;

      const isAdmin = user?.ruolo === 'admin';
      const isOwner = user?.localId === this.currio.userId;
      
      if (this.currio.status === 'privato' && !isAdmin && !isOwner) {
          this.isPrivateForViewer = true;
      } else {
          this.isPrivateForViewer = false;
      }
  }

  setLanguage(lang: string) {
    this.translate.use(lang);
  }

  smoothScrollTo(elementId: string): void {
    const element = this.el.nativeElement.querySelector(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  getProjectSchemeClass(currio: Currio, context: 'project' | 'heroButton', index: number = 0): string {
    const schemes = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'];
    if (!this.projectColorSchemes[index]) {
      this.projectColorSchemes[index] = schemes[index % schemes.length];
    }
    const scheme = this.projectColorSchemes[index];

    if (context === 'heroButton') {
      return `btn-${scheme}`;
    }
    return `project-scheme-${scheme}`;
  }
  
    getProjectSchemeColorHex(index: number, opacity: number = 1): string {
    const colorMap: { [key: string]: string } = {
        primary: '#0d6efd',
        secondary: '#6c757d',
        success: '#198754',
        danger: '#dc3545',
        warning: '#ffc107',
        info: '#0dcaf0',
    };
    const schemes = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'];
     if (!this.projectColorSchemes[index]) {
      this.projectColorSchemes[index] = schemes[index % schemes.length];
    }
    const scheme = this.projectColorSchemes[index];
    const hex = colorMap[scheme] || '#6c757d';

    if (opacity < 1) {
        let r = 0, g = 0, b = 0;
        if (hex.length == 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length == 7) {
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }
        return `rgba(${r},${g},${b},${opacity})`;
    }
    return hex;
  }


  getSkillBackgroundColor(skillName: string): string {
    let hash = 0;
    for (let i = 0; i < skillName.length; i++) {
        hash = skillName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsla(${h}, 60%, 85%, 0.7)`;
  }

  getSkillInitials(name: string): string {
    if (!name) return '?';
    const words = name.split(' ');
    if (words.length > 1) {
        return words[0][0] + words[1][0];
    }
    return name.substring(0, 2);
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
  closeMobileMenuAndScroll(elementId: string) {
    this.isMobileMenuOpen = false;
    this.smoothScrollTo(elementId);
  }
  
  toggleTimelineDetails(event: Event, esperienza: CurrioEsperienza): void {
      event.preventDefault();
      esperienza.expanded = !esperienza.expanded;
  }
  
  shouldShowNavClassic(): boolean {
      if (!this.currio) return false;
      return !!this.currio.heroSubtitle ||
             (!!this.currio.progetti && this.currio.progetti.length > 0) ||
             (!!this.currio.esperienze && this.currio.esperienze.length > 0) ||
             (!!this.currio.competenze && this.currio.competenze.length > 0) ||
             !!this.currio.chiSonoDescrizione1 ||
             !!this.currio.contatti?.email;
  }

  ngOnDestroy(): void {
    if (this.currioSubscription) {
      this.currioSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}
