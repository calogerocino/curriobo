import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { AppState } from 'src/app/shared/app.state';
import { Currio } from 'src/app/shared/models/currio.model';
import { loadCurrioById } from 'src/app/views/currio/state/currio.action';
import { getCurrioById, getCurrioLoading, getCurrioError } from 'src/app/views/currio/state/currio.selector';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-currio-preview',
  templateUrl: './currio-preview.component.html',
  styleUrls: ['./currio-preview.component.scss']
})
export class CurrioPreviewComponent implements OnInit, OnDestroy {
  currio: Currio | undefined;
  private routeSub: Subscription | undefined;
  private dataSub: Subscription | undefined;
  private loadingSub: Subscription | undefined;
  private errorSub: Subscription | undefined;

  isLoading = true; // Inizia come true
  currentYear: number = new Date().getFullYear();

  constructor(
    private route: ActivatedRoute,
    private store: Store<AppState>,
    private titleService: Title
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.store.dispatch(loadCurrioById({ id }));

        if (this.dataSub) this.dataSub.unsubscribe();
        if (this.loadingSub) this.loadingSub.unsubscribe();
        if (this.errorSub) this.errorSub.unsubscribe();

        this.loadingSub = this.store.select(getCurrioLoading).subscribe(loading => {
          if (!loading && this.isLoading) {
          } else {
            this.isLoading = loading;
          }
          console.log('CurrioPreview isLoading:', this.isLoading);
        });

        this.dataSub = this.store.select(getCurrioById, { id })
          .subscribe(currioData => {
            console.log('Dati Curriò ricevuti dallo store in Preview:', currioData);
            this.currio = currioData;
            if (this.currio) {
              this.titleService.setTitle(this.currio.nomePortfolio || 'Anteprima Curriò');
              this.isLoading = false;
            }
          });

        this.errorSub = this.store.select(getCurrioError).subscribe(error => {
          if (error) {
            console.error("Errore nel caricamento del Curriò (dallo store):", error);
            this.isLoading = false;
            this.currio = undefined;
          }
        });

      } else {
        console.error("ID del Curriò non fornito nella rotta.");
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) this.routeSub.unsubscribe();
    if (this.dataSub) this.dataSub.unsubscribe();
    if (this.loadingSub) this.loadingSub.unsubscribe();
    if (this.errorSub) this.errorSub.unsubscribe();
  }

  toggleTimelineDetails(event: MouseEvent): void {
    const trigger = event.currentTarget as HTMLElement;
    const content = trigger.nextElementSibling as HTMLElement;
    const arrow = trigger.querySelector('.new-timeline-arrow') as HTMLElement;

    if (content && arrow) {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        content.style.maxHeight = null;
        content.classList.remove('expanded');
        arrow.classList.remove('expanded');
        trigger.setAttribute('aria-expanded', 'false');
      } else {
        content.classList.add('expanded');
        content.style.maxHeight = content.scrollHeight + "px";
        arrow.classList.add('expanded');
        trigger.setAttribute('aria-expanded', 'true');
      }
    }
  }

  getSkillBackgroundColor(skillName: string): string {
    let hash = 0;
    for (let i = 0; i < skillName.length; i++) {
      hash = skillName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - color.length) + color;
  }

  getSkillInitials(skillName: string): string {
    return skillName.substring(0, 2).toUpperCase();
  }
}
