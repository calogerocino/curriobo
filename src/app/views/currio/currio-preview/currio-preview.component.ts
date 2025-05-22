import {
  Component,
  OnInit,
  OnDestroy,
  Renderer2,
  Inject,
  PLATFORM_ID,
  AfterViewInit,
  ElementRef,
} from '@angular/core';
import { isPlatformBrowser, ViewportScroller } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import {
  Currio,
  CurrioEsperienza,
  CurrioProgetto,
} from 'src/app/shared/models/currio.model';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/shared/app.state';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, Observable } from 'rxjs';
import { loadCurrioById } from 'src/app/views/currio/state/currio.action';
import {
  getCurrioById,
  getCurrioLoading,
  getCurrioError,
} from 'src/app/views/currio/state/currio.selector';
import { Title } from '@angular/platform-browser';
import { User } from 'src/app/shared/models/user.interface';
import { getUser } from '../../auth/state/auth.selector';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-currio-preview',
  templateUrl: './currio-preview.component.html',
  styleUrls: [
    './currio-preview.component.scss',
    './templates/modern-template.scss',
    './templates/vintage-template.scss',
    './templates/classic-template.scss',
  ],
})
export class CurrioPreviewComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  currio: Currio | undefined;
  private routeSub: Subscription | undefined;
  private dataSub: Subscription | undefined;
  private loadingSub: Subscription | undefined;
  private errorSub: Subscription | undefined;
  private langChangeSub: Subscription | undefined;

  isLoading = true;
  currentYear: number = new Date().getFullYear();
  isMobileMenuOpen = false;
  isUserAdmin$: Observable<boolean>;

  private projectBaseColorsHex: string[] = [
    '#0d6efd',
    '#dc3545',
    '#6f42c1',
    '#198754',
    '#ffc107',
    '#0dcaf0',
    '#fd7e14',
  ];

  constructor(
    private route: ActivatedRoute,
    private store: Store<AppState>,
    private titleService: Title,
    public translate: TranslateService,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private elRef: ElementRef,
    private viewportScroller: ViewportScroller
  ) {
    this.isUserAdmin$ = this.store
      .select(getUser)
      .pipe(map((user) => !!user && user.ruolo === 'admin'));
  }

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.store.dispatch(loadCurrioById({ id }));
        this.subscribeToCurrioData(id);
      } else {
        this.isLoading = false;
        this.router.navigate(['/error'], {
          queryParams: { type: '404', message: 'currio_id_missing' },
        });
      }
    });

    this.langChangeSub = this.translate.onLangChange.subscribe(() => {
      if (isPlatformBrowser(this.platformId) && this.currio) {
      }
    });
  }

  ngAfterViewInit(): void {}

  private subscribeToCurrioData(id: string): void {
    if (this.dataSub) this.dataSub.unsubscribe();
    if (this.loadingSub) this.loadingSub.unsubscribe();
    if (this.errorSub) this.errorSub.unsubscribe();

    this.loadingSub = this.store
      .select(getCurrioLoading)
      .subscribe((loading) => {
        this.isLoading = loading;
      });

    this.dataSub = this.store
      .select(getCurrioById, { id })
      .subscribe((currioData) => {
        if (currioData && currioData.id) {
          this.currio = {
            ...currioData,
            esperienze:
              currioData.esperienze?.map((e) => ({
                ...e,
                expanded: e.expanded || false,
              })) || [],
            templateScelto: currioData.templateScelto || 'modern',
          };
          this.titleService.setTitle(
            this.currio.nomePortfolio || 'Anteprima Curriò'
          );
          const currioLang =
            this.currio.linguaDefault ||
            (isPlatformBrowser(this.platformId)
              ? localStorage.getItem('preferredLanguage')
              : null) ||
            this.translate.getDefaultLang() ||
            'it';
          this.setLanguage(currioLang);
          this.isLoading = false;
        } else if (!this.isLoading && id === currioData?.id) {
          this.router.navigate(['/error'], {
            queryParams: { type: '404', message: 'currio_not_found' },
          });
        }
      });

    this.errorSub = this.store.select(getCurrioError).subscribe((error) => {
      if (error) {
        this.isLoading = false;
        this.currio = undefined;
        this.router.navigate(['/error'], {
          queryParams: { type: '500', message: 'currio_load_error' },
        });
      }
    });
  }

  setLanguage(lang: string) {
    this.translate.use(lang);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('preferredLanguage', lang);
    }
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    const navbarCollapse = document.getElementById('navbarNavModern');
    if (navbarCollapse) {
      if (this.isMobileMenuOpen) {
        this.renderer.addClass(navbarCollapse, 'show');
      } else {
        this.renderer.removeClass(navbarCollapse, 'show');
      }
    }
  }

  closeMobileMenuAndScroll(targetIdWithHash: string) {
    if (this.isMobileMenuOpen) {
      this.toggleMobileMenu();
    }
    setTimeout(() => {
      this.smoothScrollTo(targetIdWithHash);
    }, 100);
  }

  smoothScrollTo(targetIdWithHash: string) {
    if (isPlatformBrowser(this.platformId)) {
      const pureId = targetIdWithHash.startsWith('#')
        ? targetIdWithHash.substring(1)
        : targetIdWithHash;
      const element = document.getElementById(pureId);
      if (element) {
        const navbar = this.elRef.nativeElement.querySelector(
          '.navbar.navbar-expand-md'
        );
        let navbarHeight = 0;
        if (
          (navbar && getComputedStyle(navbar).position === 'fixed') ||
          getComputedStyle(navbar).position === 'sticky'
        ) {
          navbarHeight = navbar.offsetHeight;
        }
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - navbarHeight;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      } else {
        console.warn(
          `Element with ID '${pureId}' not found for smooth scroll.`
        );
      }
    }
  }

  toggleTimelineDetails(
    event: Event,
    esperienzaItem: CurrioEsperienza | undefined
  ): void {
    event.stopPropagation();
    if (!esperienzaItem) return;
    esperienzaItem.expanded = !esperienzaItem.expanded;
  }

  getProjectSchemeColorHex(projectIndex: number, opacity: number = 1): string {
    const color =
      this.projectBaseColorsHex[
        projectIndex % this.projectBaseColorsHex.length
      ];
    if (opacity < 1 && opacity >= 0) {
      let r = 0,
        g = 0,
        b = 0;
      if (color.length === 7) {
        r = parseInt(color.substring(1, 3), 16);
        g = parseInt(color.substring(3, 5), 16);
        b = parseInt(color.substring(5, 7), 16);
      } else if (color.length === 4) {
        r = parseInt(color.substring(1, 2).repeat(2), 16);
        g = parseInt(color.substring(2, 3).repeat(2), 16);
        b = parseInt(color.substring(3, 4).repeat(2), 16);
      }
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return color;
  }

  getProjectSchemeClass(
    item: Currio | CurrioProgetto | any,
    elementType: 'heroButton' | 'button' | 'badge'
  ): string {
    // Per il bottone Hero, usiamo sempre btn-primary o un colore specifico se vuoi.
    // L'immagine 2si.png usa un blu, quindi 'btn-primary' è una buona scelta.
    if (elementType === 'heroButton') {
      return `btn-primary`; // Esempio: blu standard di Bootstrap
    }
    // Per altri elementi, la logica di derivazione del colore può rimanere o essere adattata.
    // Visto che ora usiamo [ngStyle] per i colori dinamici dei progetti, questa funzione
    // potrebbe non essere più necessaria per 'button' e 'badge' se i colori sono gestiti interamente da ngStyle.
    // Se vuoi ancora usare classi Bootstrap per alcuni colori base, puoi mantenerla.

    // logica semplificata:
    if (item && (item as CurrioProgetto).titolo) {
      const lowerTitle = (item as CurrioProgetto).titolo.toLowerCase();
      if (lowerTitle.includes('angular') || lowerTitle.includes('pixelsmart'))
        return `btn-danger`;
      if (
        lowerTitle.includes('html/php') ||
        lowerTitle.includes('portalescifo')
      )
        return `btn-purple-bootstrap`; // Richiede CSS custom
      if (lowerTitle.includes('curriò')) return `btn-success`;
      if (lowerTitle.includes('visual basic')) return `btn-info`;
    }
    return `btn-primary`; // Default
  }

  getSkillBackgroundColor(skillName: string): string {
    let hash = 0;
    if (!skillName) return '#6c757d';
    for (let i = 0; i < skillName.length; i++) {
      hash = skillName.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash;
    }
    const colors = [
      '#0d6efd',
      '#6f42c1',
      '#dc3545',
      '#198754',
      '#ffc107',
      '#0dcaf0',
      '#212529',
      '#fd7e14',
    ];
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  getSkillInitials(skillName: string): string {
    if (!skillName) return '';
    const words = skillName.trim().split(/\s+/);
    if (words.length > 1 && words[0] && words[1]) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    if (words.length === 1 && words[0].length > 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return skillName.substring(0, 1).toUpperCase();
  }

  ngOnDestroy(): void {
    if (this.routeSub) this.routeSub.unsubscribe();
    if (this.dataSub) this.dataSub.unsubscribe();
    if (this.loadingSub) this.loadingSub.unsubscribe();
    if (this.errorSub) this.errorSub.unsubscribe();
    if (this.langChangeSub) this.langChangeSub.unsubscribe();
  }

  shouldShowNavClassic(): boolean {
    if (!this.currio) return false;
    // La navigazione viene mostrata se almeno uno dei seguenti è vero:
    return !!(
      // Il doppio 'not' converte in booleano
      (
        this.currio.heroSubtitle || // Sezione Home (identificata dal sottotitolo)
        (this.currio.progetti && this.currio.progetti.length > 0) ||
        (this.currio.esperienze && this.currio.esperienze.length > 0) ||
        (this.currio.competenze && this.currio.competenze.length > 0) ||
        this.currio.chiSonoDescrizione1 || // Sezione Chi Sono
        this.currio.contatti?.email
      ) // Sezione Contatti
    );
  }
}
