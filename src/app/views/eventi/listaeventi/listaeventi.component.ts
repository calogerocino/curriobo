import { Component, OnInit } from "@angular/core";
import { FirebaseService } from "../../../shared/servizi/firebase.service";
import { Observable } from "rxjs";
import { Event } from "src/app/shared/models/event.model";
import { Store } from "@ngrx/store";
import { AppState } from "src/app/shared/app.state";
import { getEvents } from "../state/catalogo.selector";
import { deleteEvent, loadEvents } from "../state/catalogo.action";

// import Swal from "sweetalert2";

@Component({
  selector: "app-listaeventi",
  templateUrl: "./listaeventi.component.html",
  styleUrls: ["./listaeventi.component.scss"],
})
export class ListaEventiComponent implements OnInit {
  events$: Observable<Event[]> = this.store.select(getEvents);
  constructor(private readonly store: Store<AppState>) {}

  ngOnInit(): void {
    this.store.dispatch(loadEvents());
  }

  onDeleteEvent(id: string) {
    if (confirm('Sei sicuro di voler eliminare?')) {
      this.store.dispatch(deleteEvent({ id }));
    }
  }
}
