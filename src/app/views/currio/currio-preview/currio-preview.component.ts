import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'; // Router potrebbe non essere necessario qui
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { AppState } from 'src/app/shared/app.state';
import { Currio } from 'src/app/shared/models/currio.model';
// Rimuovi CurrioService se usi solo NGRX per il fetch
import { loadCurrioById } from 'src/app/views/currio/state/currio.action'; // Assicurati che il path sia corretto
import { getCurrioById, getCurrioLoading, getCurrioError } from 'src/app/views/currio/state/currio.selector'; // Assicurati che il path sia corretto
import { Title } from '@angular/platform-browser';
import { setLoadingSpinner } from 'src/app/shared/store/shared.actions'; // Per lo spinner globale se necessario

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
  currentYear: number = new Date().getFullYear(); // Per il copyright nel footer

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
          // Potresti voler gestire lo spinner globale o uno spinner locale
          // this.store.dispatch(setLoadingSpinner({ status: loading })); // Se usi spinner globale
          if (!loading && this.isLoading) { // Se il caricamento finisce e non abbiamo ancora i dati, impostiamo isLoading a false dopo un breve ritardo
                                            // per dare tempo ai dati di arrivare, o se c'è stato un errore.
             //setTimeout(() => { if(this.isLoading) this.isLoading = false; }, 200);
          } else {
            this.isLoading = loading;
          }
          console.log('CurrioPreview isLoading:', this.isLoading);
        });

        this.dataSub = this.store.select(getCurrioById, { id })
          // Non usare filter qui se vuoi gestire il caso in cui currioData è null/undefined inizialmente
          .subscribe(currioData => {
            console.log('Dati Curriò ricevuti dallo store in Preview:', currioData);
            this.currio = currioData; // Può essere undefined se non trovato o non ancora caricato
            if (this.currio) {
              this.titleService.setTitle(this.currio.nomePortfolio || 'Anteprima Curriò');
              this.isLoading = false; // Dati ricevuti, fine caricamento
            }
            // Se currioData è undefined MA getCurrioLoading è false, significa che il caricamento è finito senza dati.
            // La gestione di questo caso (es. messaggio "non trovato") può essere fatta nel template con *ngIf="!isLoading && !currio"
          });

        this.errorSub = this.store.select(getCurrioError).subscribe(error => {
          if (error) {
            console.error("Errore nel caricamento del Curriò (dallo store):", error);
            this.isLoading = false; // Errore, fine caricamento
            this.currio = undefined; // Assicurati che currio sia undefined in caso di errore
            // Mostra un messaggio di errore all'utente se necessario
          }
        });

      } else {
        console.error("ID del Curriò non fornito nella rotta.");
        this.isLoading = false;
        // Gestisci il caso di ID mancante (es. naviga a pagina di errore)
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) this.routeSub.unsubscribe();
    if (this.dataSub) this.dataSub.unsubscribe();
    if (this.loadingSub) this.loadingSub.unsubscribe();
    if (this.errorSub) this.errorSub.unsubscribe();
  }

  // Funzione per l'espansione/collasso della timeline (se la usi come in home.html)
  toggleTimelineDetails(event: MouseEvent): void {
    const trigger = event.currentTarget as HTMLElement;
    const content = trigger.nextElementSibling as HTMLElement; // .expandable-details
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

  // Funzioni di utilità per la sezione competenze (se necessario)
  getSkillBackgroundColor(skillName: string): string {
    // Semplice funzione hash per dare colori diversi, puoi migliorarla
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
