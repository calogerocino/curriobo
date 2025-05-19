import { Component, OnInit, OnDestroy, Renderer2, Inject, PLATFORM_ID, AfterViewInit, Pipe, PipeTransform, ElementRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { Currio, CurrioEsperienza } from 'src/app/shared/models/currio.model';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/shared/app.state';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, Observable } from 'rxjs';
import { loadCurrioById } from 'src/app/views/currio/state/currio.action';
import { getCurrioById, getCurrioLoading, getCurrioError } from 'src/app/views/currio/state/currio.selector';
import { Title, DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { getUser } from '../../auth/state/auth.selector';
import { User } from 'src/app/shared/models/user.interface';
import { filter, map } from 'rxjs/operators';

@Pipe({ name: 'safeHtml'})
export class SafeHtmlPipe implements PipeTransform  {
  constructor(private sanitized: DomSanitizer) {}
  transform(value: string | undefined | null): SafeHtml {
    return this.sanitized.bypassSecurityTrustHtml(value || '');
  }
}

@Component({
  selector: 'app-currio-preview',
  templateUrl: './currio-preview.component.html',
  styleUrls: ['./currio-preview.component.scss']
  // L'incapsulamento di default (Emulated) è attivo
})
export class CurrioPreviewComponent implements OnInit, AfterViewInit, OnDestroy {
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


  constructor(
    private route: ActivatedRoute,
    private store: Store<AppState>,
    private titleService: Title,
    public translate: TranslateService,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private elRef: ElementRef
  ) {
     this.isUserAdmin$ = this.store.select(getUser).pipe(
      map(user => !!user && user.ruolo === 'admin')
    );
  }

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.store.dispatch(loadCurrioById({ id }));
        this.subscribeToCurrioData(id);
      } else {
        console.error("ID del Curriò non fornito nella rotta.");
        this.isLoading = false;
        this.router.navigate(['/error'], { queryParams: { type: '404', message: 'currio_id_missing' }});
      }
    });

    this.langChangeSub = this.translate.onLangChange.subscribe(() => {
      if (isPlatformBrowser(this.platformId) && this.currio) {
         setTimeout(() => this.setupExpandableTimeline(), 0);
      }
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Smooth scrolling non più necessario qui se gestito da (click) nel template
      // this.setupSmoothScrolling();
      if (this.currio) {
         setTimeout(() => this.setupExpandableTimeline(), 0);
      }
    }
  }

  private subscribeToCurrioData(id: string): void {
    if (this.dataSub) this.dataSub.unsubscribe();
    if (this.loadingSub) this.loadingSub.unsubscribe();
    if (this.errorSub) this.errorSub.unsubscribe();

    this.loadingSub = this.store.select(getCurrioLoading).subscribe(loading => {
      this.isLoading = loading;
    });

    this.dataSub = this.store.select(getCurrioById, { id })
      .subscribe(currioData => {
        if (currioData && currioData.id) {
          this.currio = {
            ...currioData,
            esperienze: currioData.esperienze?.map(e => ({ ...e, expanded: e.expanded || false }))
          };
          this.titleService.setTitle(this.currio.nomePortfolio || 'Anteprima Curriò');
          const currioLang = this.currio.linguaDefault || (isPlatformBrowser(this.platformId) ? localStorage.getItem('preferredLanguage') : null) || this.translate.getDefaultLang() || 'it';
          this.setLanguage(currioLang);
          if (isPlatformBrowser(this.platformId)) {
            setTimeout(() => this.setupExpandableTimeline(), 50);
          }
          this.isLoading = false;
        } else if (!this.isLoading && id === currioData?.id) {
           this.router.navigate(['/error'], { queryParams: { type: '404', message: 'currio_not_found' }});
        }
      });

    this.errorSub = this.store.select(getCurrioError).subscribe(error => {
      if (error) {
        console.error("Errore nel caricamento del Curriò:", error);
        this.isLoading = false;
        this.currio = undefined;
        this.router.navigate(['/error'], { queryParams: { type: '500', message: 'currio_load_error' }});
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
    if (isPlatformBrowser(this.platformId)) {
        const mobileMenuEl = this.elRef.nativeElement.querySelector('#mobile-menu');
        const mobileMenuButtonEl = this.elRef.nativeElement.querySelector('#mobile-menu-button');
        if (mobileMenuEl && mobileMenuButtonEl) {
            if (this.isMobileMenuOpen) {
                this.renderer.removeClass(mobileMenuEl, 'hidden');
            } else {
                this.renderer.addClass(mobileMenuEl, 'hidden');
            }
            mobileMenuButtonEl.setAttribute('aria-expanded', String(this.isMobileMenuOpen));
        }
    }
  }

  closeMobileMenuAndScroll(targetId: string) {
    if (this.isMobileMenuOpen) {
        this.toggleMobileMenu();
    }
    this.smoothScrollTo(targetId);
  }

  smoothScrollTo(targetId: string) {
    if (isPlatformBrowser(this.platformId)) {
        const targetElement = this.elRef.nativeElement.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
    }
  }

  setupExpandableTimeline(): void {
    if (!isPlatformBrowser(this.platformId) || !this.currio || !this.currio.esperienze) return;

    const timelineItems = this.elRef.nativeElement.querySelectorAll('.timeline-item .timeline-content');
    timelineItems.forEach((itemContent: HTMLElement, index: number) => {
        const newExpandTrigger = itemContent.querySelector('.timeline-expand-trigger') as HTMLElement | null;
        if (newExpandTrigger) {
            this.renderer.listen(newExpandTrigger, 'click', (event) => this.toggleTimelineDetails(event, this.currio?.esperienze?.[index]));
            this.renderer.listen(newExpandTrigger, 'keydown', (event: KeyboardEvent) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this.toggleTimelineDetails(event as any, this.currio?.esperienze?.[index]);
                }
            });
        }
    });
  }

  toggleTimelineDetails(event: Event, esperienzaItem: CurrioEsperienza | undefined): void {
    event.stopPropagation();
    if (!esperienzaItem) return;

    esperienzaItem.expanded = !esperienzaItem.expanded;

    const trigger = event.currentTarget as HTMLElement;
    const contentWrapper = trigger.closest('.timeline-content');
    if (!contentWrapper) return;

    const detailsToExpand = contentWrapper.querySelector('.expandable-details') as HTMLElement | null;
    const arrow = trigger.querySelector('.new-timeline-arrow') as HTMLElement | null;

    if (detailsToExpand && arrow) {
        if (esperienzaItem.expanded) {
            this.renderer.addClass(detailsToExpand, 'expanded');
            detailsToExpand.style.maxHeight = detailsToExpand.scrollHeight + "px";
            this.renderer.addClass(arrow, 'expanded');
        } else {
            detailsToExpand.style.maxHeight = '0px';
            this.renderer.removeClass(arrow, 'expanded');
            setTimeout(() => {
              if (!(esperienzaItem.expanded)) {
                this.renderer.removeClass(detailsToExpand, 'expanded');
              }
            }, 500);
        }
        trigger.setAttribute('aria-expanded', String(esperienzaItem.expanded));
    }
  }

  getSkillBackgroundColor(skillName: string): string {
    let hash = 0;
    if (!skillName) return '#CCCCCC';
    for (let i = 0; i < skillName.length; i++) {
      hash = skillName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - color.length) + color;
  }

  getSkillInitials(skillName: string): string {
    if (!skillName) return '';
    const words = skillName.split(' ');
    if (words.length > 1 && words[0] && words[1]) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return skillName.substring(0, 2).toUpperCase();
  }

  ngOnDestroy(): void {
    if (this.routeSub) this.routeSub.unsubscribe();
    if (this.dataSub) this.dataSub.unsubscribe();
    if (this.loadingSub) this.loadingSub.unsubscribe();
    if (this.errorSub) this.errorSub.unsubscribe();
    if (this.langChangeSub) this.langChangeSub.unsubscribe();
  }
}
