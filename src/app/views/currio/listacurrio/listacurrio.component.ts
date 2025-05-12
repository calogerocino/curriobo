import { Component, OnInit } from "@angular/core";
import { Observable } from "rxjs";
import { Event } from "src/app/shared/models/currio.model";
import { CurrioSubmission } from "src/app/shared/models/currio-submission.model"; // << AGGIUNGI
import { Store } from "@ngrx/store";
import { AppState } from "src/app/shared/app.state";
import { getEvents, getCurrioSubmissions } from "../state/currio.selector"; // << AGGIORNA SELETTORE
import { loadEvents, loadCurrioSubmissions } from "../state/currio.action"; // << AGGIORNA AZIONE

@Component({
  selector: "app-listacurrio",
  templateUrl: "./listacurrio.component.html",
  styleUrls: ["./listacurrio.component.scss"],
})
export class ListaCurrioComponent implements OnInit {
  events$: Observable<Event[]> = this.store.select(getEvents);
  currioSubmissions$: Observable<CurrioSubmission[]> = this.store.select(getCurrioSubmissions); // << NUOVA OBSERVABLE

  constructor(private readonly store: Store<AppState>) {}

  ngOnInit(): void {
    this.store.dispatch(loadEvents());
    this.store.dispatch(loadCurrioSubmissions()); // << DISPATCH PER CARICARE LE SUBMISSIONS
  }

  onDeleteEvent(id: string | undefined) { // Id può essere undefined
    if (id && confirm('Sei sicuro di voler eliminare questo currio?')) {
      // this.store.dispatch(deleteEvent({ id }));
    }
  }

  // Potresti aggiungere un metodo per eliminare le richieste se necessario
  // onDeleteCurrioSubmission(id: string | undefined) {
  //   if (id && confirm('Sei sicuro di voler eliminare questa richiesta?')) {
  //     // this.store.dispatch(deleteCurrioSubmission({ id })); // Dovresti creare l'azione e l'effetto
  //   }
  // }
}
