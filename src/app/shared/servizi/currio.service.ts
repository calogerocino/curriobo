import { Event } from '../models/currio.model';
import { CurrioSubmission } from '../models/currio-submission.model'; // << AGGIUNGI QUESTO
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  constructor(private readonly http: HttpClient) {}

  getEvents(): Observable<Event[]> {
    return this.http
      .get<{ [key: string]: Omit<Event, 'id'> }>( // Migliorata tipizzazione per Firebase
        `${environment.firebase.databaseURL}/currio.json`
      )
      .pipe(
        map((data) => {
          const events: Event[] = [];
          if (data) { // Controllo se data non è null
            for (const key in data) {
              if (data.hasOwnProperty(key)) {
                events.push({ ...data[key], id: key });
              }
            }
          }
          return events;
        })
      );
  }

  addEvent(event: Event): Observable<{ name: string }> {
    return this.http.post<{ name: string }>(
      `${environment.firebase.databaseURL}/currio.json`,
      event
    );
  }

  updateEvent(event: Event) {
    const eventData = { title: event.title, description: event.description };
    return this.http.patch(
      `${environment.firebase.databaseURL}/currio/${event.id}.json`, // Patch sull'ID specifico
      eventData
    );
  }

  deleteEvent(id: string) {
    return this.http.delete(
      `${environment.firebase.databaseURL}/currio/${id}.json`
    );
  }

  // NUOVO METODO PER LE RICHIESTE CURRIO
  getCurrioSubmissions(): Observable<CurrioSubmission[]> {
    return this.http
      .get<{ [key: string]: Omit<CurrioSubmission, 'id'> }>( // Tipizzazione per Firebase
        `${environment.firebase.databaseURL}/currioSubmissions.json`
      )
      .pipe(
        map((data) => {
          const submissions: CurrioSubmission[] = [];
          if (data) { // Controllo se data non è null
            for (const key in data) {
              if (data.hasOwnProperty(key)) {
                submissions.push({ ...data[key], id: key });
              }
            }
          }
          return submissions;
        })
      );
  }
}
