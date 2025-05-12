import { Component, OnInit } from "@angular/core";
import { Observable } from "rxjs";
import { Currio } from "src/app/shared/models/currio.model";
import { CurrioSubmission } from "src/app/shared/models/currio-submission.model";
import { Store } from "@ngrx/store";
import { AppState } from "src/app/shared/app.state";
import { Router } from '@angular/router';
// Aggiorna selettori e azioni per i Currio veri e propri
import { getCurrios, getCurrioSubmissions } from "../state/currio.selector";
import { loadCurrios, loadCurrioSubmissions, deleteCurrio } from "../state/currio.action";

@Component({
  selector: "app-listacurrio",
  templateUrl: "./listacurrio.component.html",
  styleUrls: ["./listacurrio.component.scss"],
})
export class ListaCurrioComponent implements OnInit {
  // Sostituisci 'Event[]' con 'Currio[]' e usa il selettore corretto
  currios$: Observable<Currio[]> = this.store.select(getCurrios);
  currioSubmissions$: Observable<CurrioSubmission[]> = this.store.select(getCurrioSubmissions);

  constructor(
    private readonly store: Store<AppState>,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.store.dispatch(loadCurrios()); 
    this.store.dispatch(loadCurrioSubmissions());
  }

  navigateToEdit(id: string | undefined): void {
    if (id) {
      this.router.navigate(['/admin/currio/edit', id]);
    }
  }

  navigateToCreate(): void {
    this.router.navigate(['/admin/currio/edit', 'new']); // 'new' o un ID specifico per la creazione
  }

  onDeleteCurrio(id: string | undefined): void {
    if (id && confirm('Sei sicuro di voler eliminare questo currio?')) {
      // Assumendo che 'deleteEvent' sia l'azione corretta per eliminare un Currio by ID
      this.store.dispatch(deleteCurrio({ id }));
    }
  }
}
